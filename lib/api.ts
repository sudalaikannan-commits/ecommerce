import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "./auth";

export type ApiContext = { params: Record<string, string> };

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(
    { success: true, data },
    { status: init ?? 200, headers: { "Cache-Control": "no-store" } }
  );
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

export function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }
  if (error instanceof ZodError) {
    const messages = (error.issues || []).map((e: any) =>
      `${e.path.join(".")}: ${e.message}`
    );
    return fail(messages.join("; ") || "Invalid input", 422, error.flatten());
  }
  console.error("[API ERROR]", error);
  const message =
    error instanceof Error && error.message.includes("P2002")
      ? "A record with this value already exists."
      : "Something went wrong. Please try again.";
  return fail(message, 500);
}

/** Parse and validate a JSON request body against a zod schema. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ZodError([
      { message: "Invalid JSON body", path: [], code: "custom" },
    ] as any);
  }
  return schema.parse(raw);
}

const ALLOWED_ORIGINS: (string | undefined)[] = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * CSRF protection: for state-changing requests require that the request
 * came from our own origin. The session cookie is SameSite=Lax which blocks
 * most cross-site requests, and this check is a second layer of defence.
 */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const host = new URL(base).host;

  if (!origin && !referer) return true; // non-browser clients
  const source = (origin || referer) as string;
  try {
    const url = new URL(source);
    if (url.host === host) return true;
    if (ALLOWED_ORIGINS.includes(source)) return true;
  } catch {
    return false;
  }
  return false;
}

export function assertTrustedOrigin(req: Request) {
  if (!isTrustedOrigin(req)) {
    throw new AuthError("Request rejected", 403);
  }
}

/** Parse pagination params from a URL with sane defaults/caps. */
export function paginate(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("per_page") || "12", 10) || 12)
  );
  return { page, perPage, skip: (page - 1) * perPage };
}