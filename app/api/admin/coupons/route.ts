import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { couponSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok({
      coupons: coupons.map((c) => ({
        ...c,
        value: Number(c.value),
        minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
        maxDiscountAmount: c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, couponSchema);

    const conflict = await prisma.coupon.findUnique({ where: { code: body.code } });
    if (conflict) return fail("A coupon with this code already exists.", 409);

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code,
        description: body.description || null,
        type: body.type,
        value: body.value,
        minOrderAmount: body.minOrderAmount ?? null,
        maxDiscountAmount: body.maxDiscountAmount ?? null,
        maxUses: body.maxUses ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive,
        isUserSpecific: body.isUserSpecific,
      },
    });
    return ok({ coupon }, 201);
  } catch (error) {
    return handleError(error);
  }
}