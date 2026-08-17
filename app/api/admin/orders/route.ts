import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, paginate } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip } = paginate(sp);

    const where: any = {};
    if (sp.get("status")) where.orderStatus = sp.get("status");
    if (sp.get("payment")) where.paymentStatus = sp.get("payment");
    if (sp.get("q")) {
      where.OR = [
        { orderNumber: { contains: sp.get("q")! } },
        { user: { name: { contains: sp.get("q")! } } },
        { user: { email: { contains: sp.get("q")! } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({
      orders: orders.map((o) => ({
        ...o,
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        shipping: Number(o.shipping),
        tax: Number(o.tax),
        addressSnapshot: parseJson(o.addressSnapshot, {}),
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