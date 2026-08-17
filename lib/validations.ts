import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

const email = z.email("Enter a valid email address");

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email,
  password,
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});

export const verifyOtpSchema = z.object({
  registrationId: z.string().min(1),
  regToken: z.string().min(1),
  channel: z.enum(["email", "phone"]),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});

export const resendOtpSchema = z.object({
  registrationId: z.string().min(1),
  regToken: z.string().min(1),
  channel: z.enum(["email", "phone"]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

const imageUrl = z.string().url().or(z.literal(""));

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional().nullable(),
  avatar: imageUrl.optional().nullable(),
});

export const newsletterSchema = z.object({ email });

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email,
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(5000),
});

// ------------------------------------------------------------
// ADDRESS
// ------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().min(1).max(30).default("Home"),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(5).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(100).default("India"),
  isDefault: z.boolean().optional(),
});

// ------------------------------------------------------------
// PRODUCT
// ------------------------------------------------------------

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().max(50).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  price: z.coerce.number().int().min(0).optional().nullable(),
  salePrice: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productImageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  alt: z.string().max(200).optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(300),
  sku: z.string().min(1).max(50),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1),
  brandId: z.string().optional().nullable(),
  weight: z.coerce.number().int().min(0).optional().nullable(),
  dimensions: z.string().max(100).optional().nullable(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  videoUrl: z.string().url().optional().nullable(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(variantSchema).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().nullable(),
  image: imageUrl.optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const brandSchema = z.object({
  name: z.string().min(2).max(100),
  logo: imageUrl.optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

// ------------------------------------------------------------
// CART / WISHLIST
// ------------------------------------------------------------

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export const wishlistSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
});

// ------------------------------------------------------------
// CHECKOUT & ORDERS
// ------------------------------------------------------------

export const validateCouponSchema = z.object({ code: z.string().min(1).max(50) });

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  shippingMethodId: z.string().min(1),
  paymentMethod: z.string().min(1).max(20), // COD | RAZORPAY | STRIPE | TEST
  couponCode: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  comment: z.string().max(5000).optional().nullable(),
});

// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

export const couponSchema = z.object({
  code: z.string().min(2).max(50).transform((s) => s.trim().toUpperCase()),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minOrderAmount: z.coerce.number().int().min(0).optional().nullable(),
  maxDiscountAmount: z.coerce.number().int().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isUserSpecific: z.boolean().default(false),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "REFUNDED",
  ]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const reviewModerationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const customerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

export const settingsSchema = z.object({
  storeName: z.string().max(100).optional(),
  storeTagline: z.string().max(200).optional(),
  supportEmail: z.email().optional(),
  supportPhone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  freeShippingThreshold: z.coerce.number().int().min(0).optional(),
  taxRate: z.coerce.number().int().min(0).max(100).optional(),
  announcement: z.string().max(300).optional(),
  announcementEnabled: z.boolean().optional(),
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(400).optional(),
  heroImage: z.string().max(500).optional(),
});