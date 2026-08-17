import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { getProductBySlug, getRelatedProducts, getCategoriesTree } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackProductView } from "@/lib/store";

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const product = await getProductBySlug(params.slug);
    if (!product) return fail("Product not found.", 404);

    const user = await getCurrentUser();
    await trackProductView(user?.id ?? null, product.id);

    const [related, categories] = await Promise.all([
      getRelatedProducts(product.category?.id || "", product.id, 8),
      getCategoriesTree(),
    ]);

    return ok({ product, related, categories });
  } catch (error) {
    return handleError(error);
  }
}