import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { getCategoriesTree } from "@/lib/store";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const tree = await getCategoriesTree();
    const count = await prisma.category.count({ where: { isActive: true } });
    return ok({ categories: tree, total: count });
  } catch (error) {
    return handleError(error);
  }
}