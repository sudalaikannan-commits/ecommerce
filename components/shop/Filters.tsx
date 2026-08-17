"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FilterOption {
  id: string;
  name: string;
  slug?: string;
  count?: number;
}

export function Filters({
  categories,
  brands,
}: {
  categories: FilterOption[];
  brands: FilterOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [category, setCategory] = useState(params.get("category") || "");
  const [brand, setBrand] = useState(params.get("brand") || "");
  const [minPrice, setMinPrice] = useState(params.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") || "");
  const [onSale, setOnSale] = useState(params.get("on_sale") === "true");
  const [inStock, setInStock] = useState(params.get("in_stock") === "true");
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    setCategory(params.get("category") || "");
    setBrand(params.get("brand") || "");
    setMinPrice(params.get("min_price") || "");
    setMaxPrice(params.get("max_price") || "");
    setOnSale(params.get("on_sale") === "true");
    setInStock(params.get("in_stock") === "true");
  }, [params]);

  const apply = () => {
    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (brand) next.set("brand", brand);
    if (minPrice) next.set("min_price", minPrice);
    if (maxPrice) next.set("max_price", maxPrice);
    if (onSale) next.set("on_sale", "true");
    if (inStock) next.set("in_stock", "true");
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    next.set("page", "1");
    router.push(`/shop?${next.toString()}`);
    setOpenMobile(false);
  };

  const clear = () => {
    router.push("/shop");
    setOpenMobile(false);
  };

  const hasFilters = category || brand || minPrice || maxPrice || onSale || inStock;

  const content = (
    <div className="space-y-6">
      {hasFilters && (
        <button onClick={clear} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}

      <FilterGroup title="Category">
        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="category"
              checked={category === ""}
              onChange={() => setCategory("")}
              className="text-brand-600 focus:ring-brand-500"
            />
            All Categories
          </label>
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="category"
                checked={category === c.slug}
                onChange={() => setCategory(c.slug || "")}
                className="text-brand-600 focus:ring-brand-500"
              />
              {c.name}
              {c.count != null && <span className="text-xs text-gray-400">({c.count})</span>}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="brand"
              checked={brand === ""}
              onChange={() => setBrand("")}
              className="text-brand-600 focus:ring-brand-500"
            />
            All Brands
          </label>
          {brands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="brand"
                checked={brand === b.slug}
                onChange={() => setBrand(b.slug || "")}
                className="text-brand-600 focus:ring-brand-500"
              />
              {b.name}
              {b.count != null && <span className="text-xs text-gray-400">({b.count})</span>}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input py-2"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input py-2"
          />
        </div>
      </FilterGroup>

      <div className="space-y-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          On Sale
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          In Stock Only
        </label>
      </div>

      <button onClick={apply} className="btn-primary w-full">
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpenMobile(!openMobile)}
          className="btn-secondary w-full"
        >
          <ChevronDown className="h-4 w-4" /> Filters {hasFilters ? "•" : ""}
        </button>
      </div>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenMobile(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setOpenMobile(false)} className="p-1 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="card sticky top-32 p-5">{content}</div>
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900">
        {title}
      </h4>
      {children}
    </div>
  );
}