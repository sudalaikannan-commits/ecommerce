"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";

function StripeFormInner({
  clientSecret,
  orderId,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (error) {
      showToast(error.message || "Payment failed", "error");
      setBusy(false);
      return;
    }
    try {
      await api("/api/payments/verify", {
        method: "POST",
        body: { orderId, gateway: "STRIPE", stripe_payment_intent: clientSecret.split("_secret_")[0] },
      });
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Payment verification failed", "error");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={busy} className="btn-secondary flex-1">
          Cancel
        </button>
        <button onClick={confirm} disabled={busy || !stripe} className="btn-primary flex-1">
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

export function StripePaymentModal({
  open,
  publishableKey,
  clientSecret,
  orderId,
  onSuccess,
  onClose,
}: {
  open: boolean;
  publishableKey: string;
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Complete Payment</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <StripeFormInner clientSecret={clientSecret} orderId={orderId} onSuccess={onSuccess} onCancel={onClose} />
        </Elements>
      </div>
    </div>
  );
}