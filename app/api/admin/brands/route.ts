import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { brandSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return ok({ brands });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, brandSchema);
    const slug = slugify(body.name);
    const conflict = await prisma.brand.findUnique({ where: { slug } });
    if (conflict) return fail("A brand with this name already exists.", 409);

    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug,
        logo: body.logo || null,
        description: body.description || null,
        isActive: body.isActive,
      },
    });
    return ok({ brand }, 201);
  } catch (error) {
    return handleError(error);
  }
}