import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { resendOtpSchema } from "@/lib/validations";
import { sendOtpEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import {
  generateOtp,
  hashOtp,
  maskEmail,
  maskPhone,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otp";

/** Re-sends a fresh OTP (email or phone) for a pending registration. */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, resendOtpSchema);

    const user = await prisma.user.findUnique({ where: { id: body.registrationId } });
    if (!user || user.status !== "PENDING" || user.regToken !== body.regToken) {
      return fail("Registration session not found or already completed.", 400);
    }

    // Resend cooldown to prevent OTP spam / brute force.
    if (user.lastOtpSentAt) {
      const elapsed = Date.now() - user.lastOtpSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return fail(`Please wait ${wait}s before requesting a new code.`, 429);
      }
    }

    const otp = generateOtp();
    const tokenHash = hashOtp(otp);
    const now = new Date();
    const expiry = new Date(Date.now() + OTP_TTL_MS);

    if (body.channel === "email") {
      if (user.emailVerified) {
        return fail("Email is already verified.", 400);
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailToken: tokenHash,
          emailTokenExpiry: expiry,
          emailTokenAttempts: 0,
          lastOtpSentAt: now,
        },
      });
      const sent = await sendOtpEmail(user.email, user.name, otp, OTP_TTL_MS / 60000);
      if (!sent) {
        // Clear the resend cooldown so the user can retry immediately.
        await prisma.user
          .update({ where: { id: user.id }, data: { lastOtpSentAt: null } })
          .catch(() => {});
        return fail(
          "We couldn't send the verification email right now. Please try again in a moment.",
          502
        );
      }
      return ok({
        channel: "email",
        email: maskEmail(user.email),
        expiresInSeconds: OTP_TTL_MS / 1000,
      });
    }

    // phone channel
    if (!user.emailVerified) {
      return fail("Please verify your email before verifying your phone number.", 400);
    }
    if (!user.phone) {
      return fail("Phone number is missing for verification.", 400);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneToken: tokenHash,
        phoneTokenExpiry: expiry,
        phoneTokenAttempts: 0,
        lastOtpSentAt: now,
      },
    });
    await sendSms(
      user.phone,
      `Your NovaCart verification code is ${otp}. It expires in 10 minutes. Never share this code with anyone.`
    );
    return ok({
      channel: "phone",
      phone: maskPhone(user.phone),
      expiresInSeconds: OTP_TTL_MS / 1000,
    });
  } catch (error) {
    return handleError(error);
  }
}
