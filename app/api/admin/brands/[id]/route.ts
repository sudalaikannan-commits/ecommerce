import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { brandSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, brandSchema);
    const existing = await prisma.brand.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Brand not found.", 404);

    const slug = slugify(body.name);
    const conflict = await prisma.brand.findFirst({ where: { slug, id: { not: params.id } } });
    if (conflict) return fail("A brand with this name already exists.", 409);

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug,
        logo: body.logo || null,
        description: body.description || null,
        isActive: body.isActive,
      },
    });
    return ok({ brand });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const count = await prisma.product.count({ where: { brandId: params.id } });
    if (count > 0) return fail("This brand still has products.", 409);
    await prisma.brand.delete({ where: { id: params.id } });
    return ok({ message: "Brand deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Brand not found.", 404);
    return handleError(error);
  }
}