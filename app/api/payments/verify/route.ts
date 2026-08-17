import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { verifyRazorpaySignature, markPaymentSuccess, markPaymentFailed } from "@/lib/payments";

const verifySchema = z.object({
  orderId: z.string().min(1),
  gateway: z.enum(["RAZORPAY", "STRIPE", "TEST"]),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  stripe_payment_intent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const body = await parseBody(req, verifySchema);

    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId: user.id },
      include: { payments: true },
    });
    if (!order) return fail("Order not found.", 404);

    if (order.paymentStatus === "PAID") {
      return ok({ status: "PAID", orderId: order.id });
    }

    if (body.gateway === "RAZORPAY") {
      if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
        return fail("Missing payment details.", 400);
      }
      const valid = verifyRazorpaySignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature
      );
      if (!valid) {
        await markPaymentFailed(order.id, "Razorpay signature verification failed");
        return fail("Payment verification failed.", 400);
      }
      await markPaymentSuccess(
        order.id,
        "RAZORPAY",
        body.razorpay_payment_id,
        "Razorpay",
        { gatewayOrderId: body.razorpay_order_id }
      );
      return ok({ status: "PAID", orderId: order.id });
    }

    if (body.gateway === "STRIPE") {
      if (!body.stripe_payment_intent) return fail("Missing payment details.", 400);
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      const intent = await stripe.paymentIntents.retrieve(body.stripe_payment_intent);
      if (intent.status !== "succeeded") {
        await markPaymentFailed(order.id, `Stripe payment status: ${intent.status}`);
        return fail("Payment was not successful.", 400);
      }
      await markPaymentSuccess(order.id, "STRIPE", intent.id, "Stripe Card", { status: intent.status });
      return ok({ status: "PAID", orderId: order.id });
    }

    if (body.gateway === "TEST") {
      await markPaymentSuccess(order.id, "TEST", null, "Test Payment (sandbox)", { test: true });
      return ok({ status: "PAID", orderId: order.id });
    }

    return fail("Unsupported gateway.", 400);
  } catch (error) {
    return handleError(error);
  }
}