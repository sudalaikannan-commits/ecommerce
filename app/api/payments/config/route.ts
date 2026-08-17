import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { hasOnlineGatewayConfigured } from "@/lib/payments";

export async function GET(_req: NextRequest) {
  try {
    const razorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    const stripe = Boolean(process.env.STRIPE_SECRET_KEY);

    return ok({
      gateways: {
        razorpay,
        stripe,
        test: !hasOnlineGatewayConfigured() || process.env.NODE_ENV === "development",
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      currency: "INR",
    });
  } catch (error) {
    return handleError(error);
  }
}