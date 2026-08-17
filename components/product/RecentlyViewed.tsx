"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";
import { ProductCard, type ProductCardData } from "./ProductCard";
import { Spinner } from "../ui";

export function RecentlyViewed() {
  const { user, ready } = useShop();
  const [items, setItems] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    api<{ items: ProductCardData[] }>("/api/account/recently-viewed")
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, [ready, user]);

  if (!user || !items || items.length === 0) return null;

  return (
    <section className="container-x py-8">
      <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">Recently Viewed</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}