import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/store";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  return {
    title: category ? category.name : "Category",
    description: category?.description || undefined,
  };
}

interface Props {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      parent: true,
    },
  });

  if (!category || !category.isActive) notFound();

  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else if (v) sp.set(k, v);
  });

  const sort = sp.get("sort") || "";
  const page = parseInt(sp.get("page") || "1", 10);

  const result = await listProducts({
    categorySlug: category.slug,
    sort: sort || undefined,
    page,
    perPage: 12,
  });

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="mb-6">
        <nav className="mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-brand-600">Shop</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900">{category.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">{result.total} products</p>
      </div>

      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/category/${category.slug}`}
            className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white"
          >
            All
          </Link>
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:text-brand-600"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-5 flex items-center justify-end">
        <SortSelect />
      </div>

      <ProductGrid
        products={result.products as ProductCardData[]}
        emptyTitle={`No products in ${category.name} yet`}
        emptyDescription="Check back soon or explore other categories."
      />

      <Pagination page={result.page} totalPages={result.totalPages} basePath={`/category/${category.slug}`} />
    </div>
  );
}