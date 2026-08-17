import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, changePasswordSchema);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return fail("User not found.", 404);

    const valid = await bcrypt.compare(body.currentPassword, dbUser.passwordHash);
    if (!valid) return fail("Current password is incorrect.", 400);

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return ok({ message: "Password changed successfully." });
  } catch (error) {
    return handleError(error);
  }
}