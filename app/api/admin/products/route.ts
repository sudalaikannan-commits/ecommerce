import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, paginate, assertTrustedOrigin } from "@/lib/api";
import { productSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip } = paginate(sp);

    const where: any = {};
    if (sp.get("q")) {
      where.OR = [
        { name: { contains: sp.get("q")! } },
        { sku: { contains: sp.get("q")! } },
        { slug: { contains: sp.get("q")! } },
      ];
    }
    if (sp.get("category")) where.categoryId = sp.get("category");
    if (sp.get("status") === "active") where.isActive = true;
    if (sp.get("status") === "inactive") where.isActive = false;
    if (sp.get("low_stock") === "true") where.stock = { lte: 5 };
    if (sp.get("out_of_stock") === "true") where.stock = 0;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: "asc" } },
          _count: { select: { variants: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    return ok({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: Number(p.price),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
        stock: Number(p.stock),
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNewArrival: p.isNewArrival,
        image: p.images[0]?.url ?? null,
        category: p.category?.name ?? null,
        brand: p.brand?.name ?? null,
        variantCount: p._count.variants,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, productSchema);

    const slug = slugify(body.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    const product = await prisma.product.create({
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

    return ok({ product }, 201);
  } catch (error) {
    return handleError(error);
  }
}