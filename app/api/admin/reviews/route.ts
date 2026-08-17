import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, paginate } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip } = paginate(sp);

    const where: any = {};
    if (sp.get("status")) where.status = sp.get("status");
    if (sp.get("q")) {
      where.OR = [{ comment: { contains: sp.get("q")! } }, { user: { name: { contains: sp.get("q")! } } }];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.review.count({ where }),
    ]);

    return ok({
      reviews,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return handleError(error);
  }
}