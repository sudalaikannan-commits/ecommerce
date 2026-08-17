import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const [lowStock, outOfStock, products] = await Promise.all([
      prisma.product.findMany({
        where: { stock: { gt: 0, lte: 5 } },
        include: { category: true, brand: true, images: { take: 1 } },
        orderBy: { stock: "asc" },
      }),
      prisma.product.findMany({
        where: { stock: 0 },
        include: { category: true, brand: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.findMany({
        include: { _count: { select: { orderItems: true } } },
        orderBy: { stock: "asc" },
      }),
    ]);

    return ok({
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock),
        category: p.category?.name,
        brand: p.brand?.name,
        image: p.images?.[0]?.url ?? null,
      })),
      outOfStock: outOfStock.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: 0,
        category: p.category?.name,
        brand: p.brand?.name,
      })),
      summary: {
        total: products.length,
        withStock: products.filter((p) => p.stock > 0).length,
        lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
        outOfStock: products.filter((p) => p.stock === 0).length,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}