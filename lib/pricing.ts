import { prisma } from "./prisma";
import { sellingPrice } from "./money";
import { getSettings } from "./settings";

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  variantSku: string | null;
  unitPrice: number; // selling price (after sale price applied) per unit
  originalPrice: number;
  quantity: number;
  maxStock: number;
  isAvailable: boolean;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

/**
 * Loads the cart for a user and returns enriched lines + server-computed
 * totals. The client NEVER sends prices — everything is recomputed here.
 */
export async function getCartForUser(userId: string, couponCode?: string | null) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              variants: { where: { isActive: true } },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 }, variants: { where: { isActive: true } } } },
            variant: true,
          },
        },
      },
    });
  }

  const lines: CartLine[] = cart.items
    .filter((item) => item.product.isActive)
    .map((item) => {
      const basePrice = Number(item.product.price) || 0;
      const variant = item.variant;
      const variantPrice = variant?.price != null ? Number(variant.price) : null;
      const variantSale = variant?.salePrice != null ? Number(variant.salePrice) : null;

      let price = basePrice;
      let sale = item.product.salePrice != null ? Number(item.product.salePrice) : null;
      if (variant) {
        price = variantPrice ?? basePrice;
        sale = variantSale != null ? variantSale : variantPrice != null ? null : sale;
      }
      const unitPrice = sellingPrice(price, sale);
      const maxStock = variant ? variant.stock : Number(item.product.stock) || 0;
      const quantity = Math.min(item.quantity, Math.max(maxStock, 0) || 999);

      const size = variant?.size;
      const color = variant?.color;
      const variantLabel = [color, size].filter(Boolean).join(" / ") || null;

      return {
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        productSlug: item.product.slug,
        image: item.product.images[0]?.url ?? null,
        variantId: item.variantId,
        variantLabel,
        variantSku: variant?.sku ?? item.product.sku,
        unitPrice,
        originalPrice: price,
        quantity,
        maxStock: Math.max(maxStock, 0),
        isAvailable: maxStock > 0,
        lineTotal: unitPrice * quantity,
      };
    });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const { coupon, discount } = await applyCoupon(
    couponCode || null,
    userId,
    subtotal
  );

  const settings = await getSettings();
  const activeShipping = await prisma.shippingMethod.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const shippingBase = activeShipping ? Number(activeShipping.price) : 0;
  const freeThreshold = settings.freeShippingThreshold || 0;
  const shipping =
    lines.length === 0 || (freeThreshold > 0 && subtotal >= freeThreshold)
      ? 0
      : shippingBase;

  const tax = lines.length === 0 ? 0 : Math.round(((subtotal - discount) * (settings.taxRate || 0)) / 100);
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const totals: CartTotals = {
    subtotal,
    discount,
    couponCode: coupon?.code ?? null,
    shipping,
    tax,
    total,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };

  return { lines, totals, coupon };
}

/**
 * Validates a coupon against a subtotal and returns the computed discount.
 * Throws human-readable errors for invalid/expired/limit-reached coupons.
 */
export async function applyCoupon(
  code: string | null,
  userId: string,
  subtotal: number
): Promise<{ coupon: any | null; discount: number }> {
  if (!code || subtotal <= 0) return { coupon: null, discount: 0 };

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw new CouponError("This coupon code is invalid or has expired.");
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new CouponError("This coupon is not active yet.");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new CouponError("This coupon has expired.");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponError("This coupon has reached its usage limit.");
  }
  if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount)) {
    throw new CouponError(
      `Minimum order amount for this coupon is ${formatPaise(Number(coupon.minOrderAmount))}.`
    );
  }
  if (coupon.isUserSpecific) {
    const usage = await prisma.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
    });
    if (usage) throw new CouponError("You have already used this coupon.");
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.round((subtotal * Number(coupon.value)) / 100);
  } else {
    discount = Number(coupon.value);
  }
  if (coupon.maxDiscountAmount != null) {
    discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  }
  discount = Math.min(discount, subtotal);

  return { coupon, discount };
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponError";
  }
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export const formatPaise_public = formatPaise;