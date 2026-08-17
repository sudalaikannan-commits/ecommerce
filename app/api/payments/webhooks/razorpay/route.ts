import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { verifyWebhook, markPaymentSuccess } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const verified = await verifyWebhook("RAZORPAY", req);
    if (!verified) return fail("Invalid signature", 400);

    const { event, payload } = verified;
    if (event === "payment.captured" || event === "order.paid") {
      const gatewayOrderId =
        payload.payment?.order_id || payload.order?.id || payload.entity?.order_id || null;
      const gatewayPaymentId = payload.payment?.id || payload.entity?.id || null;

      if (!gatewayOrderId) return ok({ received: true });

      const payment = await prisma.payment.findFirst({
        where: { gateway: "RAZORPAY", gatewayOrderId },
      });
      if (!payment) return ok({ received: true });

      if (payment.status !== "SUCCESS") {
        await markPaymentSuccess(payment.orderId, "RAZORPAY", gatewayPaymentId, "Razorpay", payload);
      }
    }
    return ok({ received: true });
  } catch (error) {
    return handleError(error);
  }
}