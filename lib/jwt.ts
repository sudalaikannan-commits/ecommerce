import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE = "ecom_token";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret_change_me");

export interface SessionPayload {
  userId: string;
  role: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { userId: payload.sub, role: (payload.role as string) || "CUSTOMER" };
  } catch {
    return null;
  }
}