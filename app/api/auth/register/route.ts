import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { sendOtpEmail } from "@/lib/mail";
import {
  generateOtp,
  hashOtp,
  maskEmail,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otp";

/**
 * Step 1 of registration.
 *
 * The account is created in a PENDING state (not activated) and an
 * email OTP is generated and sent. The account only becomes ACTIVE
 * after BOTH the email and phone OTPs have been verified.
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, registerSchema);

    const email = body.email.toLowerCase().trim();
    const phone = body.phone ? body.phone.trim() : null;
    if (!phone) return fail("Phone number is required for account verification.", 422);

    // Existing ACTIVE account with the same email → reject.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.status === "ACTIVE") {
      return fail("An account with this email already exists.", 409);
    }

    // An already-verified phone must not be re-used by another account.
    if (phone) {
      const phoneTaken = await prisma.user.findFirst({
        where: { phone, email: { not: email }, status: { not: "PENDING" } },
      });
      if (phoneTaken) {
        return fail("This phone number is already linked to another account.", 409);
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const regToken = randomBytes(24).toString("hex");
    const otp = generateOtp();
    const emailToken = hashOtp(otp);

    // Resume an abandoned PENDING registration (same email) or create a new one.
    let user;
    if (existing && existing.status === "PENDING") {
      // Don't let the register screen be used to spam OTP emails.
      if (
        existing.lastOtpSentAt &&
        Date.now() - existing.lastOtpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
      ) {
        const wait = Math.ceil(
          (OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.lastOtpSentAt.getTime())) / 1000
        );
        return fail(`Please wait ${wait}s before requesting a new code.`, 429);
      }
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          phone,
          passwordHash,
          regToken,
          status: "PENDING",
          emailVerified: false,
          phoneVerified: false,
          emailToken,
          emailTokenExpiry: new Date(Date.now() + OTP_TTL_MS),
          emailTokenAttempts: 0,
          phoneToken: null,
          phoneTokenExpiry: null,
          phoneTokenAttempts: 0,
          lastOtpSentAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: body.name,
          phone,
          status: "PENDING",
          regToken,
          emailVerified: false,
          phoneVerified: false,
          emailToken,
          emailTokenExpiry: new Date(Date.now() + OTP_TTL_MS),
          lastOtpSentAt: new Date(),
          cart: { create: {} },
          wishlist: { create: {} },
        },
      });
    }

    const sent = await sendOtpEmail(email, body.name, otp, OTP_TTL_MS / 60000);
    if (!sent) {
      // Clear the resend cooldown so the user can retry immediately,
      // and report the failure instead of leaving them waiting for an email.
      await prisma.user
        .update({ where: { id: user.id }, data: { lastOtpSentAt: null } })
        .catch(() => {});
      return fail(
        "We couldn't send the verification email right now. Please try again in a moment.",
        502
      );
    }

    return ok(
      {
        registrationId: user.id,
        regToken,
        step: "email",
        email: maskEmail(email),
        expiresInSeconds: OTP_TTL_MS / 1000,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
