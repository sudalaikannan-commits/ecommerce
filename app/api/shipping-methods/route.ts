import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok({ methods });
  } catch (error) {
    return handleError(error);
  }
}