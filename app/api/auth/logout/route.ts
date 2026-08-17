import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ok, handleError, assertTrustedOrigin } from "@/lib/api";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    cookies().delete(AUTH_COOKIE);
    return ok({ message: "Logged out" });
  } catch (error) {
    return handleError(error);
  }
}