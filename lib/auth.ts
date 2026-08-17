import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { verifySessionToken, signSessionToken, AUTH_COOKIE, type SessionPayload } from "./jwt";

export { AUTH_COOKIE, signSessionToken };

export type { SessionPayload };

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Builds the session cookie options. The `Secure` flag is only applied when the
 * request actually arrived over HTTPS (either directly or via the
 * `x-forwarded-proto` header set by a reverse proxy). Setting it blindly in
 * production breaks sessions served over plain HTTP (e.g. http://localhost).
 */
export function sessionCookieOptions(req: NextRequest, value: string) {
  const forwarded = req.headers.get("x-forwarded-proto");
  const proto = forwarded ? forwarded.split(",")[0].trim() : req.nextUrl.protocol.replace(":", "");
  return {
    name: AUTH_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Returns the current user from the session cookie, or null. */
export async function getCurrentUser() {
  const session = await getSessionFromCookies();
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user || user.status !== "ACTIVE") return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated", 401);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated", 401);
  if (user.role !== "ADMIN") throw new AuthError("Admin access required", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}