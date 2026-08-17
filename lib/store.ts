import { prisma } from "./prisma";
import { sellingPrice, discountPercent } from "./money";
import { parseJson } from "./utils";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  sellingPrice: number;
  discountPercent: number;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  image: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  weight: number | null;
  dimensions: string | null;
  specifications: { key: string; value: string }[];
  tags: string[];
  videoUrl: string | null;
  images: { id: string; url: string; alt: string | null }[];
  variants: {
    id: string;
    sku: string | null;
    size: string | null;
    color: string | null;
    price: number | null;
    salePrice: number | null;
    sellingPrice: number;
    stock: number;
    isActive: boolean;
  }[];
  ratingDistribution: { rating: number; count: number }[];
}

/** Prisma product row -> public API shape. */
export async function serializeProduct(
  p: any,
  opts: { detail?: boolean } = {}
): Promise<ProductListItem | ProductDetail> {
  const images = (p.images || []).map((i: any) => ({
    id: i.id,
    url: i.url,
    alt: i.alt,
  }));
  const firstImage = images[0]?.url ?? null;

  const base: ProductListItem = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: p.shortDescription,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    sellingPrice: sellingPrice(Number(p.price), p.salePrice != null ? Number(p.salePrice) : null),
    discountPercent: discountPercent(Number(p.price), p.salePrice != null ? Number(p.salePrice) : null),
    stock: Number(p.stock),
    isAvailable: Number(p.stock) > 0,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    image: firstImage,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : null,
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
    rating: 0,
    reviewCount: 0,
    createdAt: p.createdAt.toISOString(),
  };

  if (opts.detail) {
    const variants = (p.variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price != null ? Number(v.price) : null,
      salePrice: v.salePrice != null ? Number(v.salePrice) : null,
      sellingPrice: sellingPrice(
        v.price != null ? Number(v.price) : Number(p.price),
        v.salePrice != null ? Number(v.salePrice) : p.salePrice != null ? Number(p.salePrice) : null
      ),
      stock: Number(v.stock),
      isActive: v.isActive,
    }));

    const approved = (p.reviews || []).filter((r: any) => r.status === "APPROVED");
    const totalRating = approved.reduce((s: number, r: any) => s + r.rating, 0);
    base.rating = approved.length ? totalRating / approved.length : 0;
    base.reviewCount = approved.length;

    const distribution: { rating: number; count: number }[] = [5, 4, 3, 2, 1]
      .map((rating) => ({
        rating,
        count: approved.filter((r: any) => r.rating === rating).length,
      }))
      .filter((d) => d.count > 0);

    return {
      ...base,
      description: p.description,
      weight: p.weight,
      dimensions: p.dimensions,
      specifications: parseJson(p.specifications, []),
      tags: parseJson(p.tags, []),
      videoUrl: p.videoUrl,
      images,
      variants,
      ratingDistribution: distribution,
    };
  }

  // List item: cheap aggregate for rating if reviews were included.
  if (p.reviews && p.reviews.length) {
    const approved = p.reviews.filter((r: any) => r.status === "APPROVED");
    if (approved.length) {
      base.rating = approved.reduce((s: number, r: any) => s + r.rating, 0) / approved.length;
      base.reviewCount = approved.length;
    }
  }

  return base;
}

export interface ProductQuery {
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
}

export async function listProducts(query: ProductQuery = {}) {
  const page = Math.max(1, query.page || 1);
  const perPage = Math.min(50, Math.max(1, query.perPage || 12));
  const where: any = { isActive: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { shortDescription: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
      { brand: { name: { contains: query.search, mode: "insensitive" } } },
      { category: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: query.categorySlug },
      include: { children: { where: { isActive: true }, include: { children: { where: { isActive: true } } } } },
    });
    if (!category) return { products: [], total: 0, page, perPage, totalPages: 0 };
    const ids = [category.id];
    for (const child of category.children) {
      ids.push(child.id);
      for (const grand of child.children) ids.push(grand.id);
    }
    where.categoryId = { in: ids };
  }
  if (query.brandSlug) {
    where.brand = { slug: query.brandSlug };
  }
  if (query.onSale) {
    // product has a sale price strictly below its list price
    where.salePrice = { not: null };
    where.AND = [
      { salePrice: { not: null } },
      { salePrice: { lt: prisma.product.fields.price } },
    ];
  }
  if (query.inStock) {
    where.stock = { gt: 0 };
  }
  if (query.minRating != null) {
    where.reviews = {
      some: { status: "APPROVED", rating: { gte: query.minRating } },
    };
  }
  if (query.minPrice != null || query.maxPrice != null) {
    // Effective selling price filter: (salePrice present and in range) OR (no salePrice and price in range)
    const priceOr: any[] = [];
    if (query.maxPrice != null) {
      priceOr.push(
        { salePrice: { not: null, lte: query.maxPrice } },
        { salePrice: null, price: { lte: query.maxPrice } }
      );
    }
    if (query.minPrice != null) {
      priceOr.push(
        { salePrice: { not: null, gte: query.minPrice } },
        { salePrice: null, price: { gte: query.minPrice } }
      );
    }
    // When both bounds given, AND of two OR sets.
    if (query.minPrice != null && query.maxPrice != null) {
      priceOr.length = 0;
      priceOr.push({
        OR: [
          { salePrice: { not: null, gte: query.minPrice, lte: query.maxPrice } },
          { salePrice: null, price: { gte: query.minPrice, lte: query.maxPrice } },
        ],
      });
    }
    where.AND = [...(where.AND || []), ...priceOr];
  }

  const sortMap: Record<string, any> = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    bestseller: { sold: "desc" },
    popular: { sold: "desc" },
    rating: { sold: "desc" }, // refined below if possible
  };
  const orderBy = sortMap[query.sort || ""] || { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: true,
        brand: true,
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const products: ProductListItem[] = [];
  for (const p of items) {
    products.push((await serializeProduct(p)) as ProductListItem);
  }

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: true,
      brand: true,
      reviews: { where: { status: "APPROVED" } },
    },
  });
  if (!product) return null;
  return (await serializeProduct(product, { detail: true })) as ProductDetail;
}

export async function getFeaturedProducts(limit = 8) {
  const items = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true, stock: { gt: 0 } },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getBestSellers(limit = 8) {
  const items = await prisma.product.findMany({
    where: { isActive: true, isBestSeller: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: { sold: "desc" },
    take: limit,
  });
  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getNewArrivals(limit = 8) {
  const items = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getTrendingProducts(limit = 8) {
  const items = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: [{ views: "desc" }, { sold: "desc" }],
    take: limit,
  });
  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getDealProducts(limit = 8) {
  const items = await prisma.product.findMany({
    where: { isActive: true, salePrice: { not: null } },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: { sold: "desc" },
    take: limit,
  });
  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getRelatedProducts(categoryId: string, productId: string, limit = 8) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });

  // Prefer the exact category, then broaden to sibling categories sharing the same parent.
  const categoryIds = [categoryId];
  if (category?.parentId) categoryIds.push(category.parentId);

  const items = await prisma.product.findMany({
    where: { isActive: true, id: { not: productId }, categoryId: { in: categoryIds } },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
    orderBy: { sold: "desc" },
    take: limit,
  });

  // Fallback 1: products from the same brand.
  if (items.length < limit) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { brandId: true } });
    const more = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        brandId: product?.brandId ?? undefined,
        categoryId: { notIn: categoryIds },
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
      orderBy: { sold: "desc" },
      take: limit - items.length,
    });
    items.push(...more);
  }

  // Fallback 2: top sellers to fill the section.
  if (items.length < limit) {
    const existing = items.map((i) => i.id);
    const top = await prisma.product.findMany({
      where: { isActive: true, id: { not: productId }, NOT: { id: { in: existing } } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, brand: true },
      orderBy: { sold: "desc" },
      take: limit - items.length,
    });
    items.push(...top);
  }

  return Promise.all(items.map((p) => serializeProduct(p)));
}

export async function getCategoriesTree() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  const byParent = new Map<string | null, any[]>();
  for (const c of categories) {
    const list = byParent.get(c.parentId) || [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  const build = (parentId: string | null): any[] => {
    return (byParent.get(parentId) || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => {
        const children = build(c.id);
        const own = c._count.products;
        const total = own + children.reduce((s, ch) => s + ch.productCount, 0);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          description: c.description,
          productCount: total,
          children,
        };
      });
  };
  return build(null);
}

export async function getRecentlyViewed(userId: string, limit = 8) {
  const rows = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          category: true,
          brand: true,
        },
      },
    },
  });
  return Promise.all(
    rows.filter((r) => r.product.isActive).map((r) => serializeProduct(r.product))
  );
}

export async function trackProductView(userId: string | null, productId: string) {
  if (!userId) return;
  await prisma.$transaction([
    prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId, productId } },
      update: { viewedAt: new Date() },
      create: { userId, productId },
    }),
    prisma.product.update({ where: { id: productId }, data: { views: { increment: 1 } } }),
  ]);
}