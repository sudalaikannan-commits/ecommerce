import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getRelatedProducts } from "@/lib/store";
import { ImageGallery } from "@/components/product/ImageGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { Reviews } from "@/components/product/Reviews";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, shortDescription: true },
  });
  return {
    title: product?.name ?? "Product",
    description: product?.shortDescription ?? undefined,
  };
}

interface Props {
  params: { slug: string };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = (await getRelatedProducts(product.category?.id || "", product.id, 8)) as ProductCardData[];

  const stockLabel = product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? "Low stock" : "In stock";

  return (
    <div className="container-x py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-brand-600">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 max-w-[200px] text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} name={product.name} />

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                {product.brand.name}
              </span>
            )}
            <Badge color={product.stock <= 0 ? "red" : product.stock <= 5 ? "amber" : "green"}>
              {stockLabel}
            </Badge>
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} color="gray">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          {product.shortDescription && (
            <p className="mt-3 text-gray-600">{product.shortDescription}</p>
          )}

          <div className="my-5 h-px bg-gray-200" />

          <BuyBox product={product} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 overflow-x-auto">
            {[
              ["description", "Description"],
              ["specs", "Specifications"],
              ["shipping", "Shipping & Returns"],
              ["reviews", `Reviews (${product.reviewCount})`],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="shrink-0 border-b-2 border-transparent pb-3 text-sm font-semibold text-gray-500 transition hover:border-brand-500 hover:text-brand-600"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div id="description" className="scroll-mt-32 py-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Description</h2>
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-gray-700">
            {product.description ? (
              product.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p>No description available for this product.</p>
            )}
          </div>
        </div>

        <div id="specs" className="scroll-mt-32 border-t border-gray-200 py-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Specifications</h2>
          {product.specifications.length > 0 ? (
            <dl className="grid max-w-3xl grid-cols-1 gap-x-8 sm:grid-cols-2">
              {product.specifications.map((spec, i) => (
                <div
                  key={i}
                  className={`flex justify-between gap-4 border-b border-gray-100 py-2.5 text-sm ${
                    i % 2 === 0 ? "sm:pr-8" : ""
                  }`}
                >
                  <dt className="text-gray-500">{spec.key}</dt>
                  <dd className="font-medium text-gray-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No specifications available.</p>
          )}
        </div>

        <div id="shipping" className="scroll-mt-32 border-t border-gray-200 py-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Shipping & Returns</h2>
          <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
              <p className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                <Info className="h-4 w-4 text-brand-600" /> Shipping
              </p>
              Orders are dispatched within 24 hours on business days. Standard delivery takes
              4–6 business days; express delivery takes 2–3 business days. Free shipping on
              orders above ₹499.
            </div>
            <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
              <p className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                <Info className="h-4 w-4 text-brand-600" /> Returns
              </p>
              You can return unused items in original packaging within 7 days of delivery for a
              full refund. See our return policy for details.
            </div>
          </div>
        </div>

        <div id="reviews" className="scroll-mt-32 border-t border-gray-200 py-8">
          <h2 className="mb-6 text-lg font-bold text-gray-900">Customer Reviews</h2>
          <Reviews productId={product.id} productName={product.name} averageRating={product.rating} />
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}

      <RecentlyViewed />
    </div>
  );
}