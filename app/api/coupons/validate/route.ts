import { NextRequest } from "next/server";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { validateCouponSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { getCartForUser, applyCoupon, CouponError } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, validateCouponSchema);

    try {
      const cart = await getCartForUser(user.id);
      const { coupon, discount } = await applyCoupon(body.code, user.id, cart.totals.subtotal);
      return ok({
        valid: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          discount,
        },
      });
    } catch (error) {
      if (error instanceof CouponError) {
        return fail(error.message, 400);
      }
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}