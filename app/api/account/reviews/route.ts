import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok({ reviews });
  } catch (error) {
    return handleError(error);
  }
}