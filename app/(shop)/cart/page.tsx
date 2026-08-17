"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader, EmptyState, Spinner } from "@/components/ui";

interface CartLine {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  maxStock: number;
  isAvailable: boolean;
  lineTotal: number;
}

interface CartData {
  lines: CartLine[];
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

export default function CartPage() {
  const router = useRouter();
  const { user, ready, showToast, refreshCartCount } = useShop();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(
    async (code?: string | null) => {
      setLoading(true);
      try {
        const url = code ? `/api/cart?coupon=${encodeURIComponent(code)}` : "/api/cart";
        const data = await api<CartData>(url);
        setCart(data);
        setCoupon(data.totals.couponCode || "");
      } catch (err: any) {
        showToast(err.message || "Could not load cart", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [ready, user, load]);

  const updateQty = async (itemId: string, quantity: number) => {
    setUpdating(itemId);
    try {
      const updated = await api<CartData>(`/api/cart?item_id=${itemId}`, {
        method: "PATCH",
        body: { quantity },
      });
      setCart(updated);
      refreshCartCount();
    } catch (err: any) {
      showToast(err.message || "Could not update quantity", "error");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const updated = await api<CartData>(`/api/cart?item_id=${itemId}`, { method: "DELETE" });
      setCart(updated);
      refreshCartCount();
      showToast("Item removed from cart.", "info");
    } catch (err: any) {
      showToast(err.message || "Could not remove item", "error");
    }
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      const res = await api<{ coupon: { discount: number } }>("/api/coupons/validate", {
        method: "POST",
        body: { code: coupon },
      });
      showToast(`Coupon applied! You save ${formatPrice(res.coupon.discount)}`);
      await load(coupon.trim());
    } catch (err: any) {
      showToast(err.message || "Invalid coupon", "error");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCoupon("");
    await load(null);
  };

  if (!ready || loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="container-x py-12">
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Please log in to view your cart"
          description="Your cart is saved to your account so you can pick up right where you left off."
          action={
            <Link href="/login" className="btn-primary">
              Login / Register
            </Link>
          }
        />
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container-x py-12">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">Your Cart</h1>
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Let's fix that!"
          action={
            <Link href="/shop" className="btn-primary">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-x py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">Your Cart</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="space-y-4">
            {cart.lines.map((line) => (
              <li
                key={line.id}
                className="card flex gap-4 p-4"
              >
                <Link
                  href={`/product/${line.productSlug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                >
                  {line.image && (
                    <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="96px" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${line.productSlug}`}
                        className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand-600"
                      >
                        {line.productName}
                      </Link>
                      {line.variantLabel && (
                        <p className="mt-0.5 text-xs text-gray-500">Variant: {line.variantLabel}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(line.id)}
                      className="shrink-0 text-gray-400 transition hover:text-red-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        onClick={() => updateQty(line.id, Math.max(1, line.quantity - 1))}
                        disabled={updating === line.id || line.quantity <= 1}
                        className="p-2 text-gray-500 hover:text-brand-600 disabled:opacity-40"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold">
                        {updating === line.id ? <Spinner className="h-4 w-4 mx-auto" /> : line.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(line.id, Math.min(line.maxStock, line.quantity + 1))}
                        disabled={updating === line.id || line.quantity >= line.maxStock}
                        className="p-2 text-gray-500 hover:text-brand-600 disabled:opacity-40"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      {line.originalPrice > line.unitPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(line.originalPrice)}
                        </p>
                      )}
                      <p className="font-semibold text-gray-900">{formatPrice(line.lineTotal)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <ArrowRight className="h-4 w-4 rotate-180" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-32 p-5">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>

            {/* Coupon */}
            <div className="mt-4">
              {cart.totals.couponCode ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                    <Tag className="h-4 w-4" /> {cart.totals.couponCode}
                  </span>
                  <button onClick={removeCoupon} className="text-xs font-semibold text-green-700 underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon code"
                    className="input flex-1 uppercase"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponBusy || !coupon.trim()}
                    className="btn-secondary shrink-0"
                  >
                    {couponBusy ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.totals.itemCount} items)</span>
                <span>{formatPrice(cart.totals.subtotal)}</span>
              </div>
              {cart.totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
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
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(cart.totals.total)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="btn-primary mt-5 w-full py-3 text-base"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}