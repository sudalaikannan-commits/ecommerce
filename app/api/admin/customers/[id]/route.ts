import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { customerStatusSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, customerStatusSchema);
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return fail("Customer not found.", 404);
    if (user.role === "ADMIN") return fail("You cannot block another admin.", 400);

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { status: body.status },
      select: { id: true, name: true, email: true, status: true },
    });
    return ok({ customer: updated });
  } catch (error) {
    return handleError(error);
  }
}