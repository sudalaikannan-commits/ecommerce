import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { parseJson } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: user.id },
      include: { items: true, payments: true, shippingMethod: true },
    });
    if (!order) return fail("Order not found.", 404);

    return ok({
      order: { ...order, addressSnapshot: parseJson(order.addressSnapshot, {}) },
    });
  } catch (error) {
    return handleError(error);
  }
}