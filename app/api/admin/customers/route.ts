import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, paginate } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip } = paginate(sp);

    const where: any = { role: "CUSTOMER" };
    if (sp.get("q")) {
      where.OR = [
        { name: { contains: sp.get("q")! } },
        { email: { contains: sp.get("q")! } },
        { phone: { contains: sp.get("q")! } },
      ];
    }
    if (sp.get("status")) where.status = sp.get("status");

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              addresses: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.user.count({ where }),
    ]);

    return ok({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        createdAt: c.createdAt,
        orderCount: c._count.orders,
        reviewCount: c._count.reviews,
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