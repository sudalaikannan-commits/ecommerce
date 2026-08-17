import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { getCartForUser } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const couponCode = req.nextUrl.searchParams.get("coupon");
    const cart = await getCartForUser(user.id, couponCode);
    return ok(cart);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, addToCartSchema);

    const product = await prisma.product.findFirst({
      where: { id: body.productId, isActive: true },
      include: { variants: true },
    });
    if (!product) return fail("Product not found.", 404);
    if (Number(product.stock) <= 0) return fail("This product is currently out of stock.", 409);

    let variant = null;
    if (body.variantId) {
      variant = await prisma.productVariant.findFirst({
        where: { id: body.variantId, productId: product.id, isActive: true },
      });
      if (!variant) return fail("Selected variant is not available.", 404);
      if (Number(variant.stock) <= 0) return fail("This variant is out of stock.", 409);
    }

    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: user.id } });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
        variantId: body.variantId || null,
      },
    });

    const maxStock = variant ? Number(variant.stock) : Number(product.stock);
    if (existingItem) {
      const newQty = existingItem.quantity + body.quantity;
      if (newQty > maxStock) {
        return fail(`Only ${maxStock} unit(s) of this item are available in stock.`, 409);
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      if (body.quantity > maxStock) {
        return fail(`Only ${maxStock} unit(s) of this item are available in stock.`, 409);
      }
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: body.variantId || null,
          quantity: body.quantity,
        },
      });
    }

    const cartData = await getCartForUser(user.id);
    return ok({ ...cartData, message: "Added to cart" }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, updateCartItemSchema);
    const itemId = req.nextUrl.searchParams.get("item_id");
    if (!itemId) return fail("Missing item_id.", 400);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      include: { product: true, variant: true },
    });
    if (!item) return fail("Cart item not found.", 404);

    const maxStock = item.variant ? Number(item.variant.stock) : Number(item.product.stock);
    if (body.quantity > maxStock) {
      return fail(`Only ${maxStock} unit(s) of this item are available in stock.`, 409);
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: body.quantity } });

    const cartData = await getCartForUser(user.id);
    return ok(cartData);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const itemId = req.nextUrl.searchParams.get("item_id");
    const clear = req.nextUrl.searchParams.get("clear") === "true";

    if (clear) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
      return ok(await getCartForUser(user.id));
    }

    if (!itemId) return fail("Missing item_id.", 400);
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
    });
    if (!item) return fail("Cart item not found.", 404);

    await prisma.cartItem.delete({ where: { id: item.id } });
    return ok(await getCartForUser(user.id));
  } catch (error) {
    return handleError(error);
  }
}