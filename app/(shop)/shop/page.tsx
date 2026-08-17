import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/store";
import { Filters } from "@/components/shop/Filters";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse our full catalog of electronics, fashion, home and more.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else if (v) sp.set(k, v);
  });

  const q = sp.get("q") || "";
  const category = sp.get("category") || "";
  const brand = sp.get("brand") || "";
  const sort = sp.get("sort") || "";
  const page = parseInt(sp.get("page") || "1", 10);

  const result = await listProducts({
    search: q || undefined,
    categorySlug: category || undefined,
    brandSlug: brand || undefined,
    minPrice: sp.get("min_price") ? parseInt(sp.get("min_price")!, 10) : undefined,
    maxPrice: sp.get("max_price") ? parseInt(sp.get("max_price")!, 10) : undefined,
    onSale: sp.get("on_sale") === "true",
    inStock: sp.get("in_stock") === "true",
    sort: sort || undefined,
    page,
    perPage: 12,
  });

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasFilters = Boolean(q || category || brand || sp.get("min_price") || sp.get("max_price") || sp.get("on_sale") || sp.get("in_stock"));

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {q ? `Results for "${q}"` : category ? "Shop" : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {result.total} product{result.total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Filters
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            count: c._count.products,
          }))}
          brands={brands.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            count: b._count.products,
          }))}
        />

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {hasFilters ? "Filtered products" : "Showing all products"}
            </p>
            <SortSelect />
          </div>

          <ProductGrid
            products={result.products as ProductCardData[]}
            emptyTitle="No products found"
            emptyDescription="Try adjusting your filters or search for something else."
          />

          <Pagination page={result.page} totalPages={result.totalPages} />
        </div>
      </div>
    </div>
  );
}