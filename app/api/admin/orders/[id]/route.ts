import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { orderStatusSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        payments: true,
        shippingMethod: true,
        coupon: true,
      },
    });
    if (!order) return fail("Order not found.", 404);
    return ok({
      order: {
        ...order,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        addressSnapshot: parseJson(order.addressSnapshot, {}),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, orderStatusSchema);
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return fail("Order not found.", 404);

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        orderStatus: body.orderStatus,
        paymentStatus: body.paymentStatus ?? order.paymentStatus,
        notes: body.notes ?? order.notes,
        cancelReason:
          body.orderStatus === "CANCELLED" ? body.notes || order.cancelReason : order.cancelReason,
      },
    });

    // Stock restoration on cancellation/return/refund
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(body.orderStatus) && order.orderStatus !== body.orderStatus) {
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      await prisma.$transaction(
        items.flatMap((item) => {
          const ops: any[] = [];
          if (item.productId) {
            ops.push(
              prisma.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity }, sold: { decrement: item.quantity } },
              })
            );
          }
          if (item.variantId) {
            ops.push(
              prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              })
            );
          }
          return ops;
        })
      );
    }

    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: `Order ${order.orderNumber} updated`,
        message: `Your order status is now ${body.orderStatus.replace(/_/g, " ").toLowerCase()}.`,
        link: `/account/orders/${order.id}`,
      },
    });

    return ok({ order: updated });
  } catch (error) {
    return handleError(error);
  }
}