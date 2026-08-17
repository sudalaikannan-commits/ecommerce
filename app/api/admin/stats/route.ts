import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const [
      totalRevenue,
      paidRevenue,
      orders,
      customers,
      products,
      categories,
      brands,
      pendingOrders,
      lowStock,
      outOfStock,
      recentOrders,
      revenueByDay,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: { in: ["PAID", "REFUNDED"] } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.brand.count(),
      prisma.order.count({ where: { orderStatus: "PENDING" } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.order.findMany({
        include: { user: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.order.groupBy({
        by: ["createdAt"],
        _sum: { total: true },
        where: { paymentStatus: { in: ["PAID", "REFUNDED"] } },
        orderBy: { createdAt: "asc" },
        take: 30,
      }),
    ]);

    const salesOverview = revenueByDay.map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      revenue: Number(r._sum.total) || 0,
    }));

    return ok({
      stats: {
        totalRevenue: Number(totalRevenue._sum.total) || 0,
        paidRevenue: Number(paidRevenue._sum.total) || 0,
        orders,
        customers,
        products,
        categories,
        brands,
        pendingOrders,
        lowStock,
        outOfStock,
      },
      recentOrders,
      salesOverview,
    });
  } catch (error) {
    return handleError(error);
  }
}