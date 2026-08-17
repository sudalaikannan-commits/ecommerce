import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { verifyWebhook, markPaymentSuccess } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const verified = await verifyWebhook("STRIPE", req);
    if (!verified) return fail("Invalid signature", 400);

    const { event, payload } = verified;

    if (event === "payment_intent.succeeded") {
      const paymentIntentId = payload.id;
      if (!paymentIntentId) return ok({ received: true });

      const payment = await prisma.payment.findFirst({
        where: { gateway: "STRIPE", gatewayPaymentId: paymentIntentId },
      });
      if (!payment) return ok({ received: true });

      if (payment.status !== "SUCCESS") {
        await markPaymentSuccess(payment.orderId, "STRIPE", paymentIntentId, "Stripe Card", payload);
      }
    }

    return ok({ received: true });
  } catch (error) {
    return handleError(error);
  }
}