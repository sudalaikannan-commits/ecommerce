import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validations";
import { randomToken } from "@/lib/utils";
import { sendMail, buildLink } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, forgotPasswordSchema);
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return the same message to avoid user enumeration.
    if (user) {
      const token = randomToken(32);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await sendMail(
        email,
        "Reset your password",
        `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${buildLink(`/reset-password?token=${token}`)}">Reset password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>`
      );
    }

    return ok({
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    return handleError(error);
  }
}