import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) return ok({ suggestions: [], products: [] });

    const suggestions = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { tags: { contains: q } },
          { brand: { name: { contains: q } } },
          { category: { name: { contains: q } } },
        ],
      },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        brand: true,
      },
      orderBy: { sold: "desc" },
      take: 8,
    });

    return ok({
      suggestions: suggestions.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
        image: p.images[0]?.url ?? null,
        category: p.category?.name,
        brand: p.brand?.name,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}