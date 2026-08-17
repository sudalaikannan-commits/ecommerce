import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/shop",
    "/offers",
    "/cart",
    "/login",
    "/register",
    "/contact",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/shipping-policy",
    "/return-policy",
  ].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}