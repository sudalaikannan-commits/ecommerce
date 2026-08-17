import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { listProducts } from "@/lib/store";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Search Results" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function SearchPage({ searchParams }: Props) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const page = parseInt(String(searchParams.page || "1"), 10);

  const result = await listProducts({
    search: q,
    sort: sort || undefined,
    page,
    perPage: 12,
  });

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {q ? `Search results for "${q}"` : "Search"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{result.total} result{result.total === 1 ? "" : "s"} found</p>
      </div>

      {!q ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">Enter a search term above</p>
          <p className="mt-1 text-sm text-gray-500">
            Search by product name, brand, category or SKU.
          </p>
        </div>
      ) : result.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <SearchX className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <p className="text-lg font-semibold text-gray-900">No results for &quot;{q}&quot;</p>
          <p className="mt-1 text-sm text-gray-500">
            Check the spelling or try a more general search.
          </p>
          <Link href="/shop" className="btn-primary mt-5">Browse All Products</Link>
        </div>
      ) : (
        <>
          <div className="mb-5 flex justify-end">
            <SortSelect />
          </div>
          <ProductGrid products={result.products as ProductCardData[]} />
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/search" />
        </>
      )}
    </div>
  );
}