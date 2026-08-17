import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { wishlistSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                category: true,
                brand: true,
              },
            },
            variant: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const items = (wishlist?.items || []).map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      salePrice: item.product.salePrice != null ? Number(item.product.salePrice) : null,
      image: item.product.images[0]?.url ?? null,
      stock: Number(item.product.stock),
      isActive: item.product.isActive,
      variant: item.variant
        ? {
            id: item.variant.id,
            size: item.variant.size,
            color: item.variant.color,
            stock: Number(item.variant.stock),
          }
        : null,
    }));

    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, wishlistSchema);

    const product = await prisma.product.findFirst({
      where: { id: body.productId, isActive: true },
    });
    if (!product) return fail("Product not found.", 404);

    if (body.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: body.variantId, productId: product.id },
      });
      if (!variant) return fail("Variant not found.", 404);
    }

    let wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId: user.id } });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: product.id,
        variantId: body.variantId || null,
      },
    });

    if (existing) {
      return ok({ message: "Already in wishlist", wishlistItemId: existing.id });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: product.id,
        variantId: body.variantId || null,
      },
    });

    return ok({ wishlistItemId: item.id }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return fail("Missing item id.", 400);

    const item = await prisma.wishlistItem.findFirst({
      where: { id, wishlist: { userId: user.id } },
    });
    if (!item) return fail("Wishlist item not found.", 404);

    await prisma.wishlistItem.delete({ where: { id } });
    return ok({ message: "Removed from wishlist." });
  } catch (error) {
    return handleError(error);
  }
}