"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Loader2, Lock, MapPin, Plus, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader, EmptyState } from "@/components/ui";
import { AddressFormModal, type AddressData } from "@/components/account/AddressFormModal";
import { StripePaymentModal } from "@/components/payment/StripePaymentModal";

interface CartData {
  lines: {
    id: string;
    productName: string;
    productSlug: string;
    image: string | null;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  totals: {
    subtotal: number;
    discount: number;
    couponCode: string | null;
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;
  };
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDays: string | null;
}

interface GatewayConfig {
  razorpay: boolean;
  stripe: boolean;
  test: boolean;
  razorpayKeyId: string | null;
  stripePublishableKey: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, ready, showToast, refreshCartCount } = useShop();
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [gateways, setGateways] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedShipping, setSelectedShipping] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [stripeIntent, setStripeIntent] = useState<{ clientSecret: string; orderId: string } | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [cartRes, addrRes, shipRes, gwRes] = await Promise.all([
          api<CartData>("/api/cart"),
          api<{ addresses: AddressData[] }>("/api/account/addresses"),
          api<{ methods: ShippingMethod[] }>("/api/shipping-methods"),
          api<{ gateways: GatewayConfig; razorpayKeyId: string | null; stripePublishableKey: string | null }>("/api/payments/config"),
        ]);
        setCart(cartRes);
        setAddresses(addrRes.addresses);
        setShippingMethods(shipRes.methods);
        setGateways({
          razorpay: gwRes.gateways.razorpay,
          stripe: gwRes.gateways.stripe,
          test: gwRes.gateways.test,
          razorpayKeyId: gwRes.razorpayKeyId,
          stripePublishableKey: gwRes.stripePublishableKey,
        });
        setCoupon(cartRes.totals.couponCode || "");
        const def = addrRes.addresses.find((a) => a.isDefault) || addrRes.addresses[0];
        if (def) setSelectedAddress(def.id);
        if (shipRes.methods[0]) setSelectedShipping(shipRes.methods[0].id);
        if (!gwRes.gateways.razorpay && !gwRes.gateways.stripe) setPaymentMethod("TEST");
      } catch (err: any) {
        showToast(err.message || "Could not load checkout", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user, showToast]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      const res = await api<{ coupon: { discount: number } }>("/api/coupons/validate", {
        method: "POST",
        body: { code: coupon },
      });
      showToast(`Coupon applied! You save ${formatPrice(res.coupon.discount)}`);
      const updated = await api<CartData>(`/api/cart?coupon=${encodeURIComponent(coupon.trim())}`);
      setCart(updated);
    } catch (err: any) {
      showToast(err.message || "Invalid coupon", "error");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCoupon("");
    const updated = await api<CartData>("/api/cart");
    setCart(updated);
  };

  const onAddressSaved = (addr: AddressData) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === addr.id);
      const next = exists ? prev.map((a) => (a.id === addr.id ? addr : a)) : [...prev, addr];
      return next;
    });
    setSelectedAddress(addr.id);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      showToast("Please select a delivery address.", "error");
      return;
    }
    if (!selectedShipping) {
      showToast("Please select a shipping method.", "error");
      return;
    }
    setPlacing(true);
    try {
      const res = await api<{
        order: { id: string; orderNumber: string; total: number };
        payment: { gateway: string; gatewayOrderId?: string | null; clientSecret?: string | null; keyId?: string | null; amount: number; status: string };
      }>("/api/checkout", {
        method: "POST",
        body: {
          addressId: selectedAddress,
          shippingMethodId: selectedShipping,
          paymentMethod,
          couponCode: coupon || null,
          notes,
        },
      });

      const { order, payment } = res;

      if (payment.gateway === "TEST" || payment.gateway === "COD") {
        refreshCartCount();
        router.push(`/checkout/success?order=${order.id}`);
        return;
      }

      if (payment.gateway === "RAZORPAY" && payment.keyId && payment.gatewayOrderId) {
        await openRazorpay(payment, order.id, order.orderNumber);
        return;
      }

      if (payment.gateway === "STRIPE" && payment.clientSecret) {
        setStripeIntent({ clientSecret: payment.clientSecret, orderId: order.id });
        return;
      }
    } catch (err: any) {
      showToast(err.message || "Could not place your order", "error");
    } finally {
      setPlacing(false);
    }
  };

  const openRazorpay = (payment: any, orderId: string, orderNumber: string) => {
    return new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = {
          key: payment.keyId,
          amount: payment.amount,
          currency: "INR",
          name: "NovaCart",
          description: `Order ${orderNumber}`,
          order_id: payment.gatewayOrderId,
          handler: async (response: any) => {
            try {
              await api("/api/payments/verify", {
                method: "POST",
                body: {
                  orderId,
                  gateway: "RAZORPAY",
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
              refreshCartCount();
              router.push(`/checkout/success?order=${orderId}`);
            } catch (err: any) {
              showToast(err.message || "Payment verification failed", "error");
            }
            resolve();
          },
          modal: {
            ondismiss: () => {
              showToast("Payment was cancelled. Your order is not confirmed.", "info");
              resolve();
            },
          },
          theme: { color: "#4f46e5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          showToast("Payment failed. Please try again.", "error");
          resolve();
        });
        rzp.open();
      };
      script.onerror = () => {
        showToast("Could not load payment gateway. Please try again.", "error");
        resolve();
      };
      document.body.appendChild(script);
    });
  };

  if (!ready || loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="container-x py-12">
        <EmptyState
          title="Please log in to checkout"
          description="You need an account to place an order."
          action={<Link href="/login" className="btn-primary">Login / Register</Link>}
        />
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container-x py-12">
        <EmptyState
          title="Your cart is empty"
          description="Add some products before checking out."
          action={<Link href="/shop" className="btn-primary">Start Shopping</Link>}
        />
      </div>
    );
  }

  const payments = [
    { value: "COD", label: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: Banknote },
    ...(gateways?.razorpay ? [{ value: "RAZORPAY", label: "Razorpay", desc: "UPI, cards, netbanking & wallets", icon: CreditCard }] : []),
    ...(gateways?.stripe ? [{ value: "STRIPE", label: "Stripe Card", desc: "Pay securely with your card", icon: CreditCard }] : []),
    ...(gateways?.test ? [{ value: "TEST", label: "Test Payment (Sandbox)", desc: "Simulated payment for testing — no real charge", icon: CreditCard }] : []),
  ];

  return (
    <div className="container-x py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-brand-600" /> Delivery Address
            </h2>
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">You have no saved addresses yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition ${
                      selectedAddress === addr.id
                        ? "border-brand-600 bg-brand-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="sr-only"
                    />
                    <div className="mb-1 flex items-center justify-between">
                      <span className="chip bg-brand-100 text-brand-700">{addr.label}</span>
                      {addr.isDefault && <span className="text-xs text-gray-400">Default</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.line1}</p>
                    {addr.line2 && <p className="text-sm text-gray-600">{addr.line2}</p>}
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setEditingAddress(null);
                setShowAddressForm(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" /> Add New Address
            </button>
          </section>

          {/* Shipping */}
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Shipping Method</h2>
            <div className="space-y-3">
              {shippingMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition ${
                    selectedShipping === m.id
                      ? "border-brand-600 bg-brand-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === m.id}
                      onChange={() => setSelectedShipping(m.id)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">
                        {m.estimatedDays} · {m.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {m.price === 0 ? "Free" : formatPrice(m.price)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-5">
            <h2 className="mb-1 font-semibold text-gray-900">Payment Method</h2>
            <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
              <Lock className="h-3.5 w-3.5" /> All payments are encrypted and processed securely.
            </p>
            <div className="space-y-3">
              {payments.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${
                    paymentMethod === p.value
                      ? "border-brand-600 bg-brand-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === p.value}
                    onChange={() => setPaymentMethod(p.value)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <p.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Order notes (optional)"
              className="input mt-4 min-h-[70px] resize-y"
              maxLength={1000}
            />
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-32 p-5">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>

            <div className="mt-4 flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                className="input flex-1 uppercase"
              />
              <button onClick={applyCoupon} disabled={couponBusy || !coupon.trim()} className="btn-secondary shrink-0">
                {couponBusy ? "..." : "Apply"}
              </button>
            </div>

            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {line.image && <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gray-900">{line.productName}</p>
                    {line.variantLabel && <p className="text-xs text-gray-500">{line.variantLabel}</p>}
                    <p className="text-xs text-gray-500">Qty: {line.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(line.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totals.subtotal)}</span>
              </div>
              {cart.totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {cart.totals.couponCode && <Tag className="ml-0.5 inline h-3 w-3" />}</span>
                  <span>-{formatPrice(cart.totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{cart.totals.shipping === 0 ? "FREE" : formatPrice(cart.totals.shipping)}</span>
              </div>
              {cart.totals.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(cart.totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(cart.totals.total)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="btn-primary mt-5 w-full py-3.5 text-base"
            >
              {placing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </span>
              ) : (
                "Place Order"
              )}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              By placing your order you agree to our Terms & Conditions.
            </p>
          </div>
        </div>
      </div>

      <AddressFormModal
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        address={editingAddress}
        onSaved={onAddressSaved}
      />

      <StripePaymentModal
        open={Boolean(stripeIntent)}
        publishableKey={gateways?.stripePublishableKey || ""}
        clientSecret={stripeIntent?.clientSecret || ""}
        orderId={stripeIntent?.orderId || ""}
        onClose={() => setStripeIntent(null)}
        onSuccess={() => {
          setStripeIntent(null);
          refreshCartCount();
          router.push(`/checkout/success?order=${stripeIntent?.orderId}`);
        }}
      />
    </div>
  );
}