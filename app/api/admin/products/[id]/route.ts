import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { productSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: true,
        brand: true,
      },
    });
    if (!product) return fail("Product not found.", 404);

    return ok({
      product: {
        ...product,
        price: Number(product.price),
        salePrice: product.salePrice != null ? Number(product.salePrice) : null,
        specifications: product.specifications ? JSON.parse(product.specifications) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
        variants: product.variants.map((v) => ({
          ...v,
          price: v.price != null ? Number(v.price) : null,
          salePrice: v.salePrice != null ? Number(v.salePrice) : null,
        })),
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
    const body = await parseBody(req, productSchema);

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Product not found.", 404);

    const slug = slugify(body.name);
    const slugConflict = await prisma.product.findFirst({
      where: { slug, id: { not: params.id } },
    });
    const finalSlug = slugConflict ? `${slug}-${Date.now().toString(36)}` : slug;

    const product = await prisma.$transaction(
      async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.deleteMany({ where: { productId: params.id } });

      return tx.product.update({
        where: { id: params.id },
        data: {
          name: body.name,
          slug: finalSlug,
          sku: body.sku,
          shortDescription: body.shortDescription || null,
          description: body.description || null,
          price: body.price,
          salePrice: body.salePrice ?? null,
          categoryId: body.categoryId,
          brandId: body.brandId || null,
          weight: body.weight ?? null,
          dimensions: body.dimensions || null,
          specifications: body.specifications?.length ? JSON.stringify(body.specifications) : null,
          tags: body.tags?.length ? JSON.stringify(body.tags) : null,
          stock: body.stock,
          isFeatured: body.isFeatured,
          isBestSeller: body.isBestSeller,
          isNewArrival: body.isNewArrival,
          isActive: body.isActive,
          videoUrl: body.videoUrl || null,
          images: {
            create: body.images.map((img, i) => ({ url: img.url, alt: img.alt, sortOrder: i })),
          },
          variants: {
            create: body.variants.map((v) => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              price: v.price,
              salePrice: v.salePrice,
              stock: v.stock,
              isActive: v.isActive,
            })),
          },
        },
        include: { images: true, variants: true, category: true, brand: true },
      });
    },
    { maxWait: 10000, timeout: 30000 }
  );

    return ok({ product });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ message: "Product deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Product not found.", 404);
    return handleError(error);
  }
}