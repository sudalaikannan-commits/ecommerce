import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { reviewModerationSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, reviewModerationSchema);
    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return fail("Review not found.", 404);

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    return ok({ review: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    await prisma.review.delete({ where: { id: params.id } });
    return ok({ message: "Review deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Review not found.", 404);
    return handleError(error);
  }
}