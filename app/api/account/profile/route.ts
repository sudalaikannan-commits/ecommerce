import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin, isTrustedOrigin } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, updateProfileSchema);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        phone: body.phone || null,
        avatar: body.avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    return handleError(error);
  }
}