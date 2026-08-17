"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";
import { Badge } from "../ui";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  sellingPrice: number;
  discountPercent: number;
  stock: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  image: string | null;
  rating: number;
  reviewCount: number;
  brand?: { name: string } | null;
  category?: { name: string } | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { user, showToast, refreshCartCount, refreshWishlistCount } = useShop();
  const [busy, setBusy] = useState(false);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast("Please log in to add items to your cart.", "info");
      return;
    }
    setBusy(true);
    try {
      await api("/api/cart", { method: "POST", body: { productId: product.id, quantity: 1 } });
      showToast(`${product.name} added to cart`);
      refreshCartCount();
    } catch (err: any) {
      showToast(err.message || "Could not add to cart", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast("Please log in to save items to your wishlist.", "info");
      return;
    }
    setBusy(true);
    try {
      await api("/api/account/wishlist", {
        method: "POST",
        body: { productId: product.id },
      });
      showToast("Added to wishlist");
      refreshWishlistCount();
    } catch (err: any) {
      showToast(err.message || "Could not update wishlist", "error");
    } finally {
      setBusy(false);
    }
  };

  const outOfStock = product.stock <= 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.discountPercent > 0 && (
              <Badge color="red">{product.discountPercent}% OFF</Badge>
            )}
            {product.isNewArrival && !outOfStock && (
              <Badge color="brand">New</Badge>
            )}
            {product.isBestSeller && !outOfStock && <Badge color="amber">Best Seller</Badge>}
          </div>
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
              <span className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white">
                Out of Stock
              </span>
            </div>
          )}
          <button
            onClick={toggleWishlist}
            disabled={busy}
            aria-label="Add to wishlist"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm transition hover:text-red-500 disabled:opacity-50"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3.5">
          <div className="mb-1 text-xs text-gray-500">
            {product.brand?.name || product.category?.name || "Store"}
          </div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900">
            {product.name}
          </h3>
          <div className="mt-1.5">
            <RatingStars rating={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-2">
            <PriceTag price={product.price} salePrice={product.salePrice} size="sm" />
          </div>
        </div>
      </Link>

      <div className="px-3.5 pb-3.5">
        <button
          onClick={addToCart}
          disabled={busy || outOfStock}
          className="w-full rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </span>
        </button>
      </div>
    </div>
  );
}