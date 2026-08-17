import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, assertTrustedOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await req.json();
    const isActive = Boolean(body.isActive);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    return ok({ product });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Product not found.", 404);
    return handleError(error);
  }
}