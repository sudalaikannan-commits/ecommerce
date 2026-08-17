import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { checkoutSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { getCartForUser, applyCoupon, CouponError } from "@/lib/pricing";
import { generateOrderNumber } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { createPaymentIntent } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, checkoutSchema);

    const settings = await getSettings();

    // ---- Load address (must belong to the user) ----
    const address = await prisma.address.findFirst({
      where: { id: body.addressId, userId: user.id },
    });
    if (!address) return fail("Please choose a valid delivery address.", 400);

    // ---- Load shipping method ----
    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: { id: body.shippingMethodId, isActive: true },
    });
    if (!shippingMethod) return fail("Please choose a valid shipping method.", 400);

    // ---- Load & validate cart ----
    const cart = await getCartForUser(user.id, body.couponCode || null);
    if (cart.lines.length === 0) return fail("Your cart is empty.", 400);

    for (const line of cart.lines) {
      if (!line.isAvailable) {
        return fail(`${line.productName} is out of stock. Please remove it from your cart.`, 409);
      }
    }

    // ---- Re-validate coupon on the server ----
    let coupon: any = null;
    let discount = 0;
    if (body.couponCode) {
      try {
        const result = await applyCoupon(body.couponCode, user.id, cart.totals.subtotal);
        coupon = result.coupon;
        discount = result.discount;
      } catch (error) {
        if (error instanceof CouponError) {
          return fail(error.message, 400);
        }
        throw error;
      }
    }

    // ---- Server-side totals ----
    const subtotal = cart.totals.subtotal;
    const freeThreshold = settings.freeShippingThreshold || 0;
    const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : Number(shippingMethod.price);
    const tax = Math.round(((subtotal - discount) * (settings.taxRate || 0)) / 100);
    const total = Math.max(0, subtotal - discount + shipping + tax);

    const addressSnapshot = {
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    // ---- Create the order inside a transaction ----
    const orderNumber = generateOrderNumber();
    let order: any;

    try {
      order = await prisma.$transaction(
        async (tx) => {
        // Re-validate stock and decrement
        for (const line of cart.lines) {
          const dbProduct = await tx.product.findUnique({ where: { id: line.productId } });
          if (!dbProduct) throw new Error("PRODUCT_GONE");
          if (Number(dbProduct.stock) < line.quantity) {
            throw new Error(`STOCK_${line.productId}`);
          }
          await tx.product.update({
            where: { id: line.productId },
            data: {
              stock: { decrement: line.quantity },
              sold: { increment: line.quantity },
            },
          });
          if (line.variantId) {
            const dbVariant = await tx.productVariant.findUnique({ where: { id: line.variantId } });
            if (!dbVariant || Number(dbVariant.stock) < line.quantity) {
              throw new Error(`STOCK_${line.productId}`);
            }
            await tx.productVariant.update({
              where: { id: line.variantId },
              data: { stock: { decrement: line.quantity } },
            });
          }
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            subtotal,
            discount,
            shipping,
            tax,
            total,
            couponId: coupon?.id ?? null,
            couponCode: coupon?.code ?? null,
            shippingMethodId: shippingMethod.id,
            paymentMethod: body.paymentMethod,
            paymentStatus: body.paymentMethod === "COD" ? "PENDING" : "PENDING",
            orderStatus: "CONFIRMED",
            addressSnapshot: JSON.stringify(addressSnapshot),
            notes: body.notes || null,
            items: {
              create: cart.lines.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                productName: line.productName,
                productSlug: line.productSlug,
                image: line.image,
                variantLabel: line.variantLabel,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                totalPrice: line.lineTotal,
              })),
            },
          },
          include: { items: true },
        });

        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
          await tx.couponUsage.create({
            data: { couponId: coupon.id, userId: user.id, orderId: newOrder.id },
          });
        }

        await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

        await tx.notification.create({
          data: {
            userId: user.id,
            type: "ORDER",
            title: `Order ${newOrder.orderNumber} placed`,
            message: `Your order worth ${formatPaise(newOrder.total)} has been placed successfully.`,
            link: `/account/orders/${newOrder.id}`,
          },
        });

        return newOrder;
      },
        // Neon is a serverless Postgres over a proxy — give the transaction
        // enough time (SQLite ran instantly, network round-trips do not).
        { maxWait: 10000, timeout: 30000 }
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("STOCK_")) {
        return fail("One of the items in your cart is no longer available in the requested quantity. Please update your cart.", 409);
      }
      if (error instanceof Error && error.message === "PRODUCT_GONE") {
        return fail("One of the items in your cart is no longer available.", 409);
      }
      throw error;
    }

    // ---- Create the payment intent (COD, TEST, Razorpay, Stripe) ----
    let payment: any = { gateway: body.paymentMethod, status: "PENDING" };
    if (body.paymentMethod !== "COD") {
      payment = await createPaymentIntent(
        order.id,
        order.orderNumber,
        total,
        body.paymentMethod,
        user.id,
        { name: user.name, email: user.email, phone: user.phone }
      );
    }

    // Built-in TEST payments simulate immediate success.
    if (payment.gateway === "TEST") {
      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { orderId: order.id, status: "PENDING" },
          data: { status: "SUCCESS", method: "Test Payment (sandbox)" },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID" },
        }),
      ]);
      payment = { ...payment, status: "SUCCESS" };
    }

    return ok(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
        payment,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}