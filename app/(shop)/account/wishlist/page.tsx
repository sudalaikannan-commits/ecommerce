"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { EmptyState, PageLoader } from "@/components/ui";
import { RatingStars } from "@/components/product/RatingStars";
import { PriceTag } from "@/components/product/PriceTag";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  stock: number;
  isActive: boolean;
  variant: { id: string; size: string | null; color: string | null; stock: number } | null;
}

export default function WishlistPage() {
  const { showToast, refreshCartCount, refreshWishlistCount } = useShop();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ items: WishlistItem[] }>("/api/account/wishlist");
        setItems(res.items);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const remove = async (id: string) => {
    try {
      await api(`/api/account/wishlist?id=${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      refreshWishlistCount();
      showToast("Removed from wishlist");
    } catch (err: any) {
      showToast(err.message || "Could not remove item", "error");
    }
  };

  const addToCart = async (item: WishlistItem) => {
    try {
      await api("/api/cart", {
        method: "POST",
        body: { productId: item.productId, variantId: item.variant?.id || undefined, quantity: 1 },
      });
      showToast(`${item.name} added to cart`);
      refreshCartCount();
      await remove(item.id);
    } catch (err: any) {
      showToast(err.message || "Could not add to cart", "error");
    }
  };

  if (loading) return <PageLoader />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save products you love and they'll show up here."
        action={<Link href="/shop" className="btn-primary">Discover Products</Link>}
      />
    );
  }

  return (
    <div>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Heart className="h-5 w-5 fill-brand-600 text-brand-600" /> My Wishlist ({items.length})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const outOfStock = item.stock <= 0 || !item.isActive;
          const discount = item.salePrice != null ? Math.round(((item.price - item.salePrice) / item.price) * 100) : 0;
          return (
            <div key={item.id} className="card group flex flex-col overflow-hidden">
              <Link href={`/product/${item.slug}`} className="relative aspect-[4/3] block overflow-hidden bg-gray-100">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 640px) 100vw, 400px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
                )}
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <span className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white">
                      {item.stock <= 0 ? "Out of Stock" : "Unavailable"}
                    </span>
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link href={`/product/${item.slug}`} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-brand-600">
                  {item.name}
                </Link>
                {item.variant?.color || item.variant?.size ? (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {[item.variant?.color, item.variant?.size].filter(Boolean).join(" / ")}
                  </p>
                ) : null}
                <div className="mt-1.5">
                  <RatingStars rating={0} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {item.salePrice != null && (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-600">{discount}% OFF</span>
                  )}
                  <PriceTag price={item.price} salePrice={item.salePrice} size="sm" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={outOfStock}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                    </span>
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label="Remove from wishlist"
                    className="rounded-lg border border-gray-200 px-3 text-gray-500 transition hover:border-red-200 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}