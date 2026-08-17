import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    });
    return ok({
      brands: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        productCount: b._count.products,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}