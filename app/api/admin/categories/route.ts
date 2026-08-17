import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: { include: { _count: { select: { products: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return ok({ categories });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, categorySchema);
    const slug = slugify(body.name);
    const conflict = await prisma.category.findUnique({ where: { slug } });
    if (conflict) return fail("A category with this name already exists.", 409);

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        image: body.image || null,
        parentId: body.parentId || null,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });
    return ok({ category }, 201);
  } catch (error) {
    return handleError(error);
  }
}