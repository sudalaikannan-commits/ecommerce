import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent, Gift, ShieldCheck, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import {
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getTrendingProducts,
  getDealProducts,
  getCategoriesTree,
} from "@/lib/store";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductCardData } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, categories, featured, bestSellers, newArrivals, trending, deals] =
    await Promise.all([
      getSettings(),
      getCategoriesTree(),
      getFeaturedProducts(8),
      getBestSellers(8),
      getNewArrivals(8),
      getTrendingProducts(8),
      getDealProducts(4),
    ]);

  const topCategories = categories.slice(0, 6);

  return (
    <div className="animate-fade-in">
      {/* ============ HERO ============ */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        <div className="container-x grid grid-cols-1 items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
              <BadgePercent className="h-4 w-4" /> Limited Time Offers
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-base text-brand-100 sm:text-lg">
              {settings.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 text-base font-bold shadow-lg">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/offers"
                className="btn border border-white/40 bg-transparent px-6 py-3 text-base font-bold text-white hover:bg-white/10"
              >
                View Deals
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { icon: Truck, title: "Fast Delivery", sub: "2-6 days nationwide" },
                { icon: ShieldCheck, title: "Secure Payment", sub: "100% protected" },
                { icon: Gift, title: "Easy Returns", sub: "7-day returns" },
              ].map((f) => (
                <div key={f.title} className="flex items-center gap-2.5 text-white">
                  <f.icon className="h-6 w-6 shrink-0 text-brand-200" />
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-brand-200">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {(featured.length ? featured.slice(0, 4) : []).map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/10 shadow-pop"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width:1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{p.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED CATEGORIES ============ */}
      {topCategories.length > 0 && (
        <section className="container-x py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Shop by Category</h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group card flex flex-col items-center gap-3 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-cardHover"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-2xl transition group-hover:bg-brand-100">
                  {cat.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.productCount ?? 0} items</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ DEAL BANNER ============ */}
      {deals.length > 0 && (
        <section className="container-x py-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Today&apos;s Deals</p>
                <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  Up to {Math.max(...deals.map((d) => d.discountPercent))}% OFF
                </h2>
                <p className="mt-1 text-sm text-white/90">Grab the hottest discounts before they&apos;re gone.</p>
              </div>
              <Link href="/offers" className="btn bg-white px-6 py-3 font-bold text-red-600 hover:bg-red-50">
                Shop Deals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ FEATURED PRODUCTS ============ */}
      {featured.length > 0 && (
        <section className="container-x py-8">
          <SectionHeader title="Featured Products" subtitle="Handpicked products our customers love" href="/shop" />
          <ProductGrid products={featured as ProductCardData[]} />
        </section>
      )}

      {/* ============ BEST SELLERS ============ */}
      {bestSellers.length > 0 && (
        <section className="container-x py-8">
          <SectionHeader title="Best Sellers" subtitle="Most-loved items right now" href="/shop?sort=bestseller" />
          <ProductGrid products={bestSellers as ProductCardData[]} />
        </section>
      )}

      {/* ============ NEW ARRIVALS ============ */}
      {newArrivals.length > 0 && (
        <section className="bg-white py-10">
          <div className="container-x">
            <SectionHeader title="New Arrivals" subtitle="Fresh from the shelves" href="/shop?sort=newest" />
            <ProductGrid products={newArrivals as ProductCardData[]} />
          </div>
        </section>
      )}

      {/* ============ TRENDING ============ */}
      {trending.length > 0 && (
        <section className="container-x py-8">
          <SectionHeader title="Trending Now" subtitle="What everyone's checking out" href="/shop?sort=popular" />
          <ProductGrid products={trending as ProductCardData[]} />
        </section>
      )}

      {/* ============ VALUE PROPOSITION BANNERS ============ */}
      <section className="container-x py-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Free Shipping", sub: "On orders above ₹499" },
            { icon: ShieldCheck, title: "Secure Payments", sub: "Razorpay & Stripe protected" },
            { icon: Gift, title: "Easy Returns", sub: "7-day no-questions-asked" },
            { icon: BadgePercent, title: "Best Prices", sub: "Daily deals & coupons" },
          ].map((f) => (
            <div key={f.title} className="card flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
