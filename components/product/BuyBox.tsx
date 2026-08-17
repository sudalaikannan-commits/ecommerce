"use client";

import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "../providers/ShopProvider";
import { RatingStars } from "./RatingStars";
import { Badge } from "../ui";

export interface VariantData {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  price: number | null;
  salePrice: number | null;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
}

export function BuyBox({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    sellingPrice: number;
    discountPercent: number;
    stock: number;
    rating: number;
    reviewCount: number;
    variants: VariantData[];
  };
}) {
  const router = useRouter();
  const { user, showToast, refreshCartCount, refreshWishlistCount } = useShop();
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | "wish" | null>(null);

  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))), [product.variants]);
  const sizes = useMemo(() => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))), [product.variants]);

  useEffect(() => {
    if (!color && colors.length) setColor(colors[0] as string);
    if (!size && sizes.length) setSize(sizes[0] as string);
  }, [colors, sizes, color, size]);

  const activeVariant = useMemo(() => {
    const match = product.variants.find(
      (v) =>
        v.isActive &&
        (!color || v.color === color) &&
        (!size || v.size === size)
    );
    return match || null;
  }, [product.variants, color, size]);

  const displayPrice = activeVariant?.sellingPrice ?? product.sellingPrice;
  const displayOriginal = activeVariant?.price ?? product.price;
  const displaySale = activeVariant?.salePrice ?? product.salePrice;
  const maxStock = activeVariant?.stock ?? product.stock;
  const inStock = maxStock > 0;
  const discount = activeVariant
    ? activeVariant.salePrice != null && activeVariant.salePrice < (activeVariant.price ?? 0)
      ? Math.round((((activeVariant.price ?? 0) - activeVariant.salePrice) / (activeVariant.price ?? 1)) * 100)
      : 0
    : product.discountPercent;

  const payload = { productId: product.id, variantId: activeVariant?.id ?? null, quantity };

  const addToCart = async (redirect?: boolean) => {
    if (!user) {
      showToast("Please log in to add items to your cart.", "info");
      router.push("/login");
      return;
    }
    if (!inStock) {
      showToast("This product is out of stock.", "error");
      return;
    }
    setBusy(redirect ? "buy" : "cart");
    try {
      await api("/api/cart", { method: "POST", body: payload });
      refreshCartCount();
      showToast("Added to cart");
      if (redirect) router.push("/checkout");
    } catch (err: any) {
      showToast(err.message || "Could not add to cart", "error");
    } finally {
      setBusy(null);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      showToast("Please log in to save items to your wishlist.", "info");
      router.push("/login");
      return;
    }
    setBusy("wish");
    try {
      await api("/api/account/wishlist", {
        method: "POST",
        body: { productId: product.id, variantId: activeVariant?.id ?? null },
      });
      refreshWishlistCount();
      showToast("Added to wishlist");
    } catch (err: any) {
      showToast(err.message || "Could not update wishlist", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <RatingStars rating={product.rating} count={product.reviewCount} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-extrabold text-brand-600">{formatPrice(displayPrice)}</span>
        {displaySale != null && displaySale < displayOriginal && (
          <span className="text-lg text-gray-400 line-through">{formatPrice(displayOriginal)}</span>
        )}
        {discount > 0 && <Badge color="red">{discount}% OFF</Badge>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {inStock ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" /> In Stock ({maxStock} available)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Out of Stock
          </span>
        )}
      </div>

      <div className="my-4 h-px bg-gray-200" />

      {/* Color variants */}
      {colors.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-900">
            Color: <span className="text-gray-500">{color || "Select"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const available = product.variants.some((v) => v.color === c && v.stock > 0);
              return (
                <button
                  key={c}
                  disabled={!available}
                  onClick={() => setColor(c)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    color === c
                      ? "border-brand-600 bg-brand-50 font-semibold text-brand-700"
                      : "border-gray-300 text-gray-700 hover:border-brand-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size variants */}
      {sizes.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-900">
            Size: <span className="text-gray-500">{size || "Select"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const available = product.variants.some((v) => v.size === s && v.stock > 0);
              return (
                <button
                  key={s}
                  disabled={!available}
                  onClick={() => setSize(s)}
                  className={`rounded-lg border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    size === s
                      ? "border-brand-600 bg-brand-50 font-semibold text-brand-700"
                      : "border-gray-300 text-gray-700 hover:border-brand-400"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="mb-5 flex items-center gap-4">
        <p className="text-sm font-medium text-gray-900">Quantity</p>
        <div className="flex items-center rounded-lg border border-gray-300">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 text-gray-500 hover:text-brand-600 disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxStock || 99, quantity + 1))}
            className="p-2.5 text-gray-500 hover:text-brand-600 disabled:opacity-40"
            disabled={quantity >= (maxStock || 99)}
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          onClick={() => addToCart(false)}
          disabled={busy !== null || !inStock}
          className="btn-primary w-full py-3 disabled:bg-gray-300"
        >
          {busy === "cart" ? "Adding..." : (
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </span>
          )}
        </button>
        <button
          onClick={() => addToCart(true)}
          disabled={busy !== null || !inStock}
          className="btn w-full border-2 border-brand-600 bg-brand-50 py-3 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
        >
          {busy === "buy" ? "Processing..." : (
            <span className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4" /> Buy Now
            </span>
          )}
        </button>
      </div>

      <button
        onClick={toggleWishlist}
        disabled={busy === "wish"}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        <Heart className="h-4 w-4" /> Add to Wishlist
      </button>

      <div className="mt-5 space-y-2.5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-brand-600" /> Free delivery on orders above ₹499
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" /> Secure payment · 7-day easy returns
        </p>
      </div>
    </div>
  );
}