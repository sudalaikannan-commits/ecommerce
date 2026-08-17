"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "../providers/ShopProvider";
import { Spinner } from "../ui";

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
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;
  };
}

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast, refreshCartCount } = useShop();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !cart) {
      setLoading(true);
      api<CartData>("/api/cart")
        .then(setCart)
        .catch(() => setCart(null))
        .finally(() => setLoading(false));
    }
  }, [open, cart]);

  const updateQty = async (itemId: string, quantity: number) => {
    try {
      const updated = await api<CartData>(`/api/cart?item_id=${itemId}`, {
        method: "PATCH",
        body: { quantity },
      });
      setCart(updated);
      refreshCartCount();
    } catch (err: any) {
      showToast(err.message || "Could not update quantity", "error");
    }
  };

  const removeItem = async (itemId: string) => {
    const updated = await api<CartData>(`/api/cart?item_id=${itemId}`, { method: "DELETE" });
    setCart(updated);
    refreshCartCount();
  };

  const checkout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-pop transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShoppingBag className="h-5 w-5 text-brand-600" /> Your Cart
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          )}

          {!loading && cart && cart.lines.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="text-5xl">🛒</div>
              <p className="mt-4 font-medium text-gray-900">Your cart is empty</p>
              <p className="mt-1 text-sm text-gray-500">Add some products to get started.</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="btn-primary mt-5"
              >
                Continue Shopping
              </Link>
            </div>
          )}

          {cart && cart.lines.length > 0 && (
            <ul className="space-y-4">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-3">
                  <Link
                    href={`/product/${line.productSlug}`}
                    onClick={onClose}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                  >
                    {line.image && (
                      <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="80px" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${line.productSlug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand-600"
                    >
                      {line.productName}
                    </Link>
                    {line.variantLabel && (
                      <span className="mt-0.5 text-xs text-gray-500">{line.variantLabel}</span>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-gray-300">
                        <button
                          onClick={() => updateQty(line.id, Math.max(1, line.quantity - 1))}
                          className="p-1.5 text-gray-500 hover:text-brand-600 disabled:opacity-40"
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          onClick={() => updateQty(line.id, Math.min(line.maxStock, line.quantity + 1))}
                          className="p-1.5 text-gray-500 hover:text-brand-600 disabled:opacity-40"
                          disabled={line.quantity >= line.maxStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(line.lineTotal)}
                        </span>
                        <button
                          onClick={() => removeItem(line.id)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.lines.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totals.subtotal)}</span>
              </div>
              {cart.totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(cart.totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{cart.totals.shipping === 0 ? "Free" : formatPrice(cart.totals.shipping)}</span>
              </div>
              {cart.totals.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(cart.totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(cart.totals.total)}</span>
              </div>
            </div>
            <button onClick={checkout} className="btn-primary mt-4 w-full py-3 text-base">
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}