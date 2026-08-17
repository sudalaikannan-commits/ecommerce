import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { loginSchema } from "@/lib/validations";
import { signSessionToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, loginSchema);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return fail("Invalid email or password.", 401);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return fail("Invalid email or password.", 401);
    }

    if (user.status === "BLOCKED") {
      return fail("Your account has been blocked. Please contact support.", 403);
    }

    if (user.status === "PENDING") {
      return fail(
        "This account has not completed email and phone verification yet.",
        403
      );
    }

    const token = await signSessionToken({ userId: user.id, role: user.role });
    cookies().set(sessionCookieOptions(req, token));

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}