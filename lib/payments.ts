import crypto from "crypto";
import { prisma } from "./prisma";
import { AuthError } from "./auth";

export const CURRENCY = "INR";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  // Lazy require to keep the module tree-shakeable.
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = require("stripe");
  return new Stripe(key);
}

export interface PaymentIntentResult {
  gateway: string;
  orderId: string; // our internal order id
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  amount: number; // paise
  currency: string;
  keyId?: string; // razorpay publishable key for the client
  clientSecret?: string; // stripe client secret
  status: string;
}

/**
 * Creates a payment "intent" for an order.
 * - Razorpay: creates a Razorpay order (payment captured on the client).
 * - Stripe: creates a PaymentIntent.
 * - TEST/COD: returns immediately, no external call.
 * If gateway keys are missing and the method is RAZORPAY/STRIPE, it falls
 * back to the built-in TEST gateway so the shop remains usable in sandbox.
 */
export async function createPaymentIntent(
  orderId: string,
  orderNumber: string,
  amountPaise: number,
  method: string,
  userId: string,
  customer: { name: string; email: string; phone?: string | null }
): Promise<PaymentIntentResult> {
  const existing = await prisma.payment.findFirst({
    where: { orderId, status: "SUCCESS" },
  });
  if (existing) {
    throw new AuthError("This order has already been paid.", 400);
  }

  if (method === "COD") {
    await prisma.payment.create({
      data: {
        orderId,
        gateway: "COD",
        status: "PENDING",
        amount: amountPaise,
        method: "Cash on Delivery",
      },
    });
    return {
      gateway: "COD",
      orderId,
      amount: amountPaise,
      currency: CURRENCY,
      status: "PENDING",
    };
  }

  if (method === "TEST" || (method === "RAZORPAY" && !getRazorpay()) || (method === "STRIPE" && !getStripe())) {
    // Built-in sandbox payment: mark a placeholder "pending" record.
    await prisma.payment.create({
      data: {
        orderId,
        gateway: "TEST",
        status: "PENDING",
        amount: amountPaise,
        method: "Test Payment",
      },
    });
    return {
      gateway: "TEST",
      orderId,
      amount: amountPaise,
      currency: CURRENCY,
      status: "PENDING",
    };
  }

  if (method === "RAZORPAY") {
    const rzp = getRazorpay()!;
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: CURRENCY,
      receipt: orderNumber,
      notes: { orderId, userId },
    });
    await prisma.payment.create({
      data: {
        orderId,
        gateway: "RAZORPAY",
        gatewayOrderId: rzpOrder.id,
        status: "PENDING",
        amount: amountPaise,
        method: "Razorpay",
      },
    });
    return {
      gateway: "RAZORPAY",
      orderId,
      gatewayOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: CURRENCY,
      keyId: process.env.RAZORPAY_KEY_ID || "",
      status: "PENDING",
    };
  }

  if (method === "STRIPE") {
    const stripe = getStripe()!;
    const intent = await stripe.paymentIntents.create({
      amount: amountPaise,
      currency: CURRENCY.toLowerCase(),
      payment_method_types: ["card"],
      description: `Order ${orderNumber}`,
      metadata: { orderId, userId, orderNumber },
      receipt_email: customer.email,
    });
    await prisma.payment.create({
      data: {
        orderId,
        gateway: "STRIPE",
        gatewayPaymentId: intent.id,
        status: "PENDING",
        amount: amountPaise,
        method: "Stripe Card",
      },
    });
    return {
      gateway: "STRIPE",
      orderId,
      gatewayPaymentId: intent.id,
      amount: amountPaise,
      currency: CURRENCY,
      clientSecret: intent.client_secret || "",
      status: "PENDING",
    };
  }

  throw new AuthError("Unsupported payment method", 400);
}

/** Verify a Razorpay client-side payment signature. */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export async function markPaymentSuccess(
  orderId: string,
  gateway: string,
  gatewayPaymentId: string | null,
  method: string | null,
  raw: unknown
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AuthError("Order not found", 404);

  if (order.paymentStatus === "PAID") return order;

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "SUCCESS", gatewayPaymentId, method, raw: JSON.stringify(raw) },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    }),
  ]);
  return order;
}

export async function markPaymentFailed(orderId: string, reason: string) {
  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "FAILED", raw: JSON.stringify({ reason }) },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    }),
  ]);
}

/** Verify an incoming webhook using the gateway's signature scheme. */
export async function verifyWebhook(gateway: string, req: Request): Promise<{ event: string; payload: any } | null> {
  const raw = await req.text();
  if (gateway === "RAZORPAY") {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return null;
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");
    if (expected !== signature) return null;
    const payload = JSON.parse(raw);
    return { event: payload.event || "", payload };
  }
  if (gateway === "STRIPE") {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const sig = req.headers.get("stripe-signature") || "";
    try {
      const event = stripe.webhooks.constructEvent(raw, sig, secret);
      return { event: event.type, payload: event.data.object };
    } catch {
      return null;
    }
  }
  return null;
}

export function hasOnlineGatewayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ||
    Boolean(process.env.STRIPE_SECRET_KEY);
}