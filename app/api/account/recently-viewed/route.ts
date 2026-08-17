import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getRecentlyViewed } from "@/lib/store";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const items = await getRecentlyViewed(user.id, 10);
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}