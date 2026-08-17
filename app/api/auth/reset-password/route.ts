import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validations";
import { signSessionToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, resetPasswordSchema);

    const user = await prisma.user.findUnique({
      where: { resetToken: body.token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return fail("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    const token = await signSessionToken({ userId: user.id, role: user.role });
    cookies().set(sessionCookieOptions(req, token));

    return ok({ message: "Password updated successfully." });
  } catch (error) {
    return handleError(error);
  }
}