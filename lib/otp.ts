import { createHmac, randomInt, timingSafeEqual } from "crypto";

// ------------------------------------------------------------
// One-Time Password (OTP) helpers for email & phone verification.
// OTPs are 6-digit cryptographically-random codes, hashed with
// HMAC-SHA256 (keyed by the server secret) so the plain code is
// never stored in the database.
// ------------------------------------------------------------

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong attempts before the OTP is invalidated
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends

/** Cryptographically secure 6-digit OTP. */
export function generateOtp(): string {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

function hmacKey(): string {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

/** Store this instead of the plain OTP. */
export function hashOtp(otp: string): string {
  return createHmac("sha256", hmacKey()).update(otp).digest("hex");
}

/** Timing-safe comparison of a submitted OTP against the stored hash. */
export function verifyOtp(otp: string, hash: string): boolean {
  const candidate = Buffer.from(hashOtp(otp), "utf8");
  const expected = Buffer.from(hash, "utf8");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Mask an email for display, e.g. "j***n@example.com". */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (local.length <= 1) return `${local[0] || "*"}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/** Mask a phone number for display, e.g. "+91 98*** 43210". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 5) return `${phone.slice(0, 2)}***`;
  const last4 = digits.slice(-4);
  const first = phone.slice(0, Math.min(4, phone.length));
  return `${first}***${last4}`;
}
