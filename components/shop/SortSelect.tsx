"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export const SORTS = [
  { value: "", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function SortSelect({ className = "" }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") || "";

  const change = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("sort", value);
    else next.delete("sort");
    next.set("page", "1");
    router.push(`/shop?${next.toString()}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SlidersHorizontal className="h-4 w-4 text-gray-400" />
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
        aria-label="Sort products"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}