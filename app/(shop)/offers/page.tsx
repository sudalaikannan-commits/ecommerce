import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";
import { listProducts } from "@/lib/store";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Deals & Offers" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function OffersPage({ searchParams }: Props) {
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const page = parseInt(String(searchParams.page || "1"), 10);

  const result = await listProducts({ onSale: true, sort: sort || undefined, page, perPage: 12 });

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-8 text-white">
        <BadgePercent className="absolute -right-6 -top-6 h-40 w-40 opacity-20" />
        <h1 className="text-3xl font-extrabold">Deals & Offers</h1>
        <p className="mt-2 max-w-xl text-white/90">
          Handpicked discounts across electronics, fashion, home and more. Prices drop — stock won&apos;t last!
        </p>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-gray-600">{result.total} products on sale</p>
        <SortSelect />
      </div>

      <ProductGrid
        products={result.products as ProductCardData[]}
        emptyTitle="No deals right now"
        emptyDescription="Check back soon — new offers are added regularly."
      />

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/offers" />
    </div>
  );
}