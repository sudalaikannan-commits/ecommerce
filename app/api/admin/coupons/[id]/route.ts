import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { couponSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, couponSchema);
    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Coupon not found.", 404);

    const conflict = await prisma.coupon.findFirst({
      where: { code: body.code, id: { not: params.id } },
    });
    if (conflict) return fail("A coupon with this code already exists.", 409);

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
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
    return ok({ coupon });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    await prisma.coupon.delete({ where: { id: params.id } });
    return ok({ message: "Coupon deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Coupon not found.", 404);
    return handleError(error);
  }
}