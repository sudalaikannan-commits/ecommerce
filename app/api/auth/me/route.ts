import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}