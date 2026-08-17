import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { reviewSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    const { page = 1, perPage = 8 } = {
      page: parseInt(req.nextUrl.searchParams.get("page") || "1", 10),
      perPage: Math.min(20, parseInt(req.nextUrl.searchParams.get("per_page") || "8", 10)),
    };

    if (!productId) return fail("Missing productId.", 400);

    const where = { productId, status: "APPROVED" as const };
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.review.count({ where }),
    ]);

    return ok({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        user: r.user,
      })),
      total,
      page,
      perPage,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, reviewSchema);

    const product = await prisma.product.findFirst({
      where: { id: body.productId, isActive: true },
    });
    if (!product) return fail("Product not found.", 404);

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } },
    });
    if (existing) return fail("You have already reviewed this product.", 409);

    // Verified purchase if the user has a DELIVERED order containing this product
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        orderStatus: "DELIVERED",
        items: { some: { productId: product.id } },
      },
      select: { id: true },
    });

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        orderId: deliveredOrder?.id ?? null,
        rating: body.rating,
        title: body.title || null,
        comment: body.comment || null,
        isVerifiedPurchase: Boolean(deliveredOrder),
        status: "PENDING",
      },
    });

    return ok(
      { message: "Thank you! Your review has been submitted and is pending approval.", review },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}