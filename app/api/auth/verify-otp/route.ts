import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { verifyOtpSchema } from "@/lib/validations";
import { signSessionToken, sessionCookieOptions } from "@/lib/auth";
import {
  verifyOtp,
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
} from "@/lib/otp";

/**
 * Step 2 & 3 of registration.
 *
 * Verifies the emailed OTP (email channel) or the SMS OTP (phone channel).
 * After the phone OTP succeeds the account is activated and a session is
 * created so the customer lands on their dashboard already logged in.
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, verifyOtpSchema);

    const user = await prisma.user.findUnique({ where: { id: body.registrationId } });
    if (!user || user.status !== "PENDING" || user.regToken !== body.regToken) {
      return fail("Registration session not found or already completed.", 400);
    }

    if (body.channel === "email") {
      if (user.emailVerified) {
        return ok({ step: "phone" }); // already verified, move along
      }
      if (!user.emailToken || !user.emailTokenExpiry) {
        return fail("No verification code found. Please request a new one.", 400);
      }
      if (Date.now() > user.emailTokenExpiry.getTime()) {
        return fail("This code has expired. Please request a new one.", 400);
      }
      if (user.emailTokenAttempts >= OTP_MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailToken: null, emailTokenExpiry: null, emailTokenAttempts: 0 },
        });
        return fail("Too many incorrect attempts. Please request a new code.", 429);
      }

      if (!verifyOtp(body.otp, user.emailToken)) {
        const attempts = user.emailTokenAttempts + 1;
        const remaining = OTP_MAX_ATTEMPTS - attempts;
        const data: Record<string, unknown> = { emailTokenAttempts: attempts };
        if (attempts >= OTP_MAX_ATTEMPTS) {
          data.emailToken = null;
          data.emailTokenExpiry = null;
        }
        await prisma.user.update({ where: { id: user.id }, data });
        return fail(
          attempts >= OTP_MAX_ATTEMPTS
            ? "Too many incorrect attempts. Please request a new code."
            : `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          400
        );
      }

      // Email verified → activate the account directly.
      // Phone verification is optional; customers can add/verify their
      // phone number later from their account when SMS is available.
      const activated = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailToken: null,
          emailTokenExpiry: null,
          emailTokenAttempts: 0,
          phoneToken: null,
          phoneTokenExpiry: null,
          phoneTokenAttempts: 0,
          regToken: null,
          status: "ACTIVE",
        },
        select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, status: true },
      });

      const token = await signSessionToken({ userId: activated.id, role: activated.role });
      cookies().set(sessionCookieOptions(req, token));

      return ok({ user: activated }, 201);
    }

    // ---------------- phone channel ----------------
    if (!user.emailVerified) {
      return fail("Please verify your email before verifying your phone number.", 400);
    }
    if (user.phoneVerified) {
      return fail("Phone number already verified.", 400);
    }
    if (!user.phoneToken || !user.phoneTokenExpiry) {
      return fail("No verification code found. Please request a new one.", 400);
    }
    if (Date.now() > user.phoneTokenExpiry.getTime()) {
      return fail("This code has expired. Please request a new one.", 400);
    }
    if (user.phoneTokenAttempts >= OTP_MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneToken: null, phoneTokenExpiry: null, phoneTokenAttempts: 0 },
      });
      return fail("Too many incorrect attempts. Please request a new code.", 429);
    }

    if (!verifyOtp(body.otp, user.phoneToken)) {
      const attempts = user.phoneTokenAttempts + 1;
      const remaining = OTP_MAX_ATTEMPTS - attempts;
      const data: Record<string, unknown> = { phoneTokenAttempts: attempts };
      if (attempts >= OTP_MAX_ATTEMPTS) {
        data.phoneToken = null;
        data.phoneTokenExpiry = null;
      }
      await prisma.user.update({ where: { id: user.id }, data });
      return fail(
        attempts >= OTP_MAX_ATTEMPTS
          ? "Too many incorrect attempts. Please request a new code."
          : `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        400
      );
    }

    // Both verified → activate the account and create the session.
    const activated = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneToken: null,
        phoneTokenExpiry: null,
        phoneTokenAttempts: 0,
        regToken: null,
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, status: true },
    });

    const token = await signSessionToken({ userId: activated.id, role: activated.role });
    cookies().set(sessionCookieOptions(req, token));

    return ok({ user: activated }, 201);
  } catch (error) {
    return handleError(error);
  }
}
