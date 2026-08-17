import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, categorySchema);
    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Category not found.", 404);

    const slug = slugify(body.name);
    const conflict = await prisma.category.findFirst({
      where: { slug, id: { not: params.id } },
    });
    if (conflict) return fail("A category with this name already exists.", 409);

    const category = await prisma.category.update({
      where: { id: params.id },
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
    return ok({ category });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const count = await prisma.product.count({ where: { categoryId: params.id } });
    if (count > 0) {
      return fail("This category still has products. Move or delete them first.", 409);
    }
    await prisma.category.delete({ where: { id: params.id } });
    return ok({ message: "Category deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Category not found.", 404);
    return handleError(error);
  }
}