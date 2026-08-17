import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, paginate } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { parseJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { page, perPage, skip } = paginate(req.nextUrl.searchParams);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return ok({
      orders: orders.map((o) => ({
        ...o,
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