"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/money";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  category?: string;
  brand?: string;
}

export function SearchBar({
  onNavigate,
  size = "md",
  className = "",
}: {
  onNavigate?: () => void;
  size?: "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.data?.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onNavigate?.();
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} className="flex items-center">
        <div className="relative w-full">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${
              size === "lg" ? "h-5 w-5" : "h-4 w-4"
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
            placeholder="Search products, brands and more..."
            className={`w-full rounded-full border border-gray-300 bg-gray-50 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
              size === "lg" ? "py-3 text-base" : "py-2 text-sm"
            }`}
            aria-label="Search products"
          />
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-pop">
          {loading && <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No results for &quot;{query}&quot;</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setOpen(false);
                router.push(`/product/${s.slug}`);
                onNavigate?.();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50"
            >
              {s.image && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={s.image} alt={s.name} fill className="object-cover" sizes="40px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">
                  {s.brand || s.category || "Store"}
                </p>
              </div>
              <div className="shrink-0 text-sm font-semibold text-brand-600">
                {formatPrice(s.salePrice ?? s.price)}
              </div>
            </button>
          ))}
          <button
            onClick={submit}
            className="flex w-full items-center justify-center gap-1 border-t border-gray-100 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            <Search className="h-3.5 w-3.5" /> View all results for &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}