import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const paise = (rupees: number) => Math.round(rupees * 100);

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;

interface SeedProduct {
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number;
  shortDescription: string;
  description: string;
  imageId: string;
  stock: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  variants?: { size?: string; color?: string; stock: number; salePrice?: number }[];
  tags: string[];
  weight?: number;
  dimensions?: string;
  specifications?: { key: string; value: string }[];
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Aurora Wireless Headphones",
    sku: "ELEC-AURORA-001",
    category: "Headphones",
    brand: "SoundWave",
    price: 4499,
    salePrice: 2999,
    shortDescription: "Premium over-ear wireless headphones with active noise cancellation and 40-hour battery life.",
    description:
      "Immerse yourself in studio-quality sound with the Aurora Wireless Headphones. Featuring hybrid active noise cancellation, plush memory-foam ear cushions, and a 40-hour battery that lasts all week, these headphones are perfect for work, travel, and daily listening.",
    imageId: "photo-1505740420928-5e560c06d30e",
    stock: 50,
    featured: true,
    bestSeller: true,
    newArrival: true,
    variants: [
      { color: "Black", stock: 25 },
      { color: "Silver", stock: 15 },
      { color: "Blue", stock: 10 },
    ],
    tags: ["wireless", "headphones", "noise cancelling", "bluetooth"],
    weight: 250,
    dimensions: "18 x 16 x 8 cm",
    specifications: [
      { key: "Battery Life", value: "40 hours" },
      { key: "Bluetooth Version", value: "5.3" },
      { key: "Charging", value: "USB-C fast charge" },
      { key: "Weight", value: "250 g" },
    ],
  },
  {
    name: "Apex Smart Watch Pro",
    sku: "ELEC-APEX-002",
    category: "Wearables",
    brand: "Apex",
    price: 7999,
    salePrice: 6499,
    shortDescription: "AMOLED display smartwatch with GPS, heart-rate monitoring, and 10-day battery.",
    description:
      "The Apex Smart Watch Pro tracks your health and fitness with precision. A vibrant AMOLED display, built-in GPS, SpO2 and heart-rate monitoring, and 100+ workout modes keep you motivated every day. Up to 10 days of battery on a single charge.",
    imageId: "photo-1523275335684-37898b6baf30",
    stock: 40,
    featured: true,
    newArrival: true,
    tags: ["smartwatch", "fitness", "gps", "wearable"],
    weight: 48,
    dimensions: "44 x 38 x 10 mm",
    specifications: [
      { key: "Display", value: "1.43\" AMOLED" },
      { key: "Battery", value: "10 days" },
      { key: "Water Resistance", value: "5 ATM" },
      { key: "Connectivity", value: "Bluetooth 5.0, GPS" },
    ],
  },
  {
    name: "SonicBoom Portable Speaker",
    sku: "ELEC-SONIC-003",
    category: "Audio",
    brand: "SoundWave",
    price: 3499,
    salePrice: 2499,
    shortDescription: "360° waterproof portable Bluetooth speaker with deep bass and 24-hour playtime.",
    description:
      "Take the party anywhere with the SonicBoom Portable Speaker. Delivering 360° room-filling sound with punchy bass, IPX7 waterproofing, and 24 hours of playtime, it's the ultimate companion for outdoor adventures.",
    imageId: "photo-1545454675-3531b543be5d",
    stock: 60,
    bestSeller: true,
    variants: [
      { color: "Charcoal", stock: 30 },
      { color: "Teal", stock: 20 },
      { color: "Orange", stock: 10 },
    ],
    tags: ["speaker", "bluetooth", "waterproof", "portable"],
    weight: 680,
    dimensions: "20 x 8 x 8 cm",
    specifications: [
      { key: "Playtime", value: "24 hours" },
      { key: "Waterproof", value: "IPX7" },
      { key: "Bluetooth", value: "5.2" },
      { key: "Output", value: "30W" },
    ],
  },
  {
    name: "UltraBook 14\" Laptop",
    sku: "ELEC-ULTRA-004",
    category: "Laptops",
    brand: "NovaTech",
    price: 54999,
    salePrice: 47999,
    shortDescription: "Ultra-slim 14\" laptop with 16GB RAM, 512GB SSD and all-day battery.",
    description:
      "A sleek ultrabook that powers through your day. The UltraBook 14 features a 2.8K display, 13th-gen processor, 16GB RAM, and a 512GB NVMe SSD. At just 1.2kg, it's made for the modern professional on the move.",
    imageId: "photo-1496181133206-80ce9b88a853",
    stock: 15,
    featured: true,
    tags: ["laptop", "ultrabook", "ssd", "productivity"],
    weight: 1200,
    dimensions: "31.2 x 21.4 x 1.5 cm",
    specifications: [
      { key: "Processor", value: "Intel Core i7 13th Gen" },
      { key: "RAM", value: "16 GB LPDDR5" },
      { key: "Storage", value: "512 GB NVMe SSD" },
      { key: "Display", value: "14\" 2.8K IPS" },
      { key: "Battery", value: "Up to 16 hours" },
    ],
  },
  {
    name: "NovaPhone 5G",
    sku: "ELEC-NOVA-005",
    category: "Mobiles",
    brand: "NovaTech",
    price: 29999,
    salePrice: 25999,
    shortDescription: "6.7\" AMOLED 5G smartphone with 108MP camera and 5000mAh battery.",
    description:
      "Capture life in stunning detail with the NovaPhone 5G. A 108MP triple camera system, silky 120Hz AMOLED display, and a massive 5000mAh battery with 67W fast charging make this the best value flagship of the year.",
    imageId: "photo-1511707171634-5f897ff02aa9",
    stock: 30,
    featured: true,
    bestSeller: true,
    tags: ["smartphone", "5g", "camera", "android"],
    weight: 195,
    dimensions: "16.3 x 7.5 x 0.8 cm",
    specifications: [
      { key: "Display", value: "6.7\" 120Hz AMOLED" },
      { key: "Camera", value: "108MP + 12MP + 5MP" },
      { key: "Battery", value: "5000 mAh, 67W" },
      { key: "Storage", value: "256 GB" },
    ],
  },
  {
    name: "Eclipse DSLR Camera",
    sku: "ELEC-ECLIPSE-006",
    category: "Cameras",
    brand: "OptiShot",
    price: 42999,
    salePrice: 38999,
    shortDescription: "24MP DSLR with 18-55mm lens kit, 4K video and flip-out touchscreen.",
    description:
      "Unleash your creativity with the Eclipse DSLR. A 24.2MP APS-C sensor, 4K UHD video, and a flexible flip-out touchscreen make it perfect for photography enthusiasts stepping up from their phone.",
    imageId: "photo-1526170375885-4d8ecf77b99f",
    stock: 12,
    tags: ["camera", "dslr", "photography", "4k"],
    weight: 540,
    dimensions: "13 x 10 x 8 cm",
    specifications: [
      { key: "Sensor", value: "24.2MP APS-C" },
      { key: "Video", value: "4K UHD 30fps" },
      { key: "Lens", value: "18-55mm f/3.5-5.6" },
      { key: "Screen", value: "3\" flip-out touchscreen" },
    ],
  },
  {
    name: "Classic Denim Jacket",
    sku: "FASH-DENIM-101",
    category: "Jackets",
    brand: "UrbanWear",
    price: 2499,
    salePrice: 1799,
    shortDescription: "Timeless medium-wash denim jacket with a comfortable, tailored fit.",
    description:
      "A wardrobe staple that never goes out of style. The Classic Denim Jacket features durable stitching, a versatile medium wash, and a fit that works over hoodies or shirts alike.",
    imageId: "photo-1551028719-00167b16eac5",
    stock: 45,
    bestSeller: true,
    variants: [
      { size: "S", stock: 10 },
      { size: "M", stock: 15 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 8 },
    ],
    tags: ["denim", "jacket", "casual", "unisex"],
    weight: 600,
    dimensions: "",
    specifications: [
      { key: "Material", value: "100% Cotton Denim" },
      { key: "Care", value: "Machine wash cold" },
      { key: "Fit", value: "Regular fit" },
    ],
  },
  {
    name: "Everyday Cotton T-Shirt (3-Pack)",
    sku: "FASH-TEE-102",
    category: "T-Shirts",
    brand: "UrbanWear",
    price: 1499,
    salePrice: 999,
    shortDescription: "Soft combed-cotton crew neck tees in three classic colours.",
    description:
      "Three ultra-soft combed-cotton tees, ready for everything from gym to brunch. A classic crew neck and breathable fabric keep you comfortable all day.",
    imageId: "photo-1521572163474-6864f9cf17ab",
    stock: 80,
    newArrival: true,
    variants: [
      { size: "S", color: "White", stock: 20 },
      { size: "M", color: "White", stock: 20 },
      { size: "L", color: "White", stock: 15 },
      { size: "M", color: "Black", stock: 15 },
      { size: "L", color: "Black", stock: 10 },
    ],
    tags: ["t-shirt", "cotton", "casual", "men"],
    weight: 450,
    dimensions: "",
    specifications: [
      { key: "Material", value: "100% Combed Cotton" },
      { key: "Pack", value: "3 pieces" },
      { key: "Fit", value: "Regular fit" },
    ],
  },
  {
    name: "Velocity Running Shoes",
    sku: "FASH-VELOCITY-103",
    category: "Shoes",
    brand: "StrideX",
    price: 3999,
    salePrice: 2799,
    shortDescription: "Lightweight running shoes with responsive cushioning and breathable mesh.",
    description:
      "Hit new personal bests in the Velocity Running Shoes. An engineered mesh upper keeps your feet cool while responsive foam cushions every stride. Built for daily runs and gym sessions alike.",
    imageId: "photo-1542291026-7eec264c27ff",
    stock: 35,
    featured: true,
    bestSeller: true,
    variants: [
      { size: "7", color: "Black", stock: 8 },
      { size: "8", color: "Black", stock: 10 },
      { size: "9", color: "Black", stock: 9 },
      { size: "10", color: "Black", stock: 8 },
      { size: "8", color: "Grey", stock: 6 },
      { size: "9", color: "Grey", stock: 6 },
    ],
    tags: ["shoes", "running", "sports", "athletic"],
    weight: 260,
    dimensions: "",
    specifications: [
      { key: "Upper", value: "Engineered mesh" },
      { key: "Midsole", value: "Responsive EVA foam" },
      { key: "Outsole", value: "High-abrasion rubber" },
      { key: "Weight", value: "260 g (size 9)" },
    ],
  },
  {
    name: "Metro Leather Tote Bag",
    sku: "FASH-TOTE-104",
    category: "Bags",
    brand: "UrbanWear",
    price: 3299,
    salePrice: 2599,
    shortDescription: "Genuine leather tote with padded laptop sleeve and magnetic closure.",
    description:
      "Carry everything you need in style. The Metro Leather Tote features a genuine leather exterior, a padded 15\" laptop sleeve, and a magnetic top closure with secure interior pockets.",
    imageId: "photo-1548036328-c9fa89d128fa",
    stock: 25,
    tags: ["bag", "leather", "tote", "women"],
    weight: 900,
    dimensions: "38 x 30 x 12 cm",
    specifications: [
      { key: "Material", value: "Genuine leather" },
      { key: "Laptop Sleeve", value: "Fits up to 15\"" },
      { key: "Closure", value: "Magnetic" },
    ],
  },
  {
    name: "Retro Polarized Sunglasses",
    sku: "FASH-SUN-105",
    category: "Accessories",
    brand: "StrideX",
    price: 1299,
    salePrice: 899,
    shortDescription: "Polarized UV400 sunglasses in a timeless retro frame.",
    description:
      "Shield your eyes in retro style. These polarized UV400 sunglasses cut glare while the lightweight acetate frame keeps you comfortable all day.",
    imageId: "photo-1572635196237-14b3f281503f",
    stock: 55,
    newArrival: true,
    variants: [
      { color: "Black", stock: 25 },
      { color: "Tortoise", stock: 20 },
      { color: "Green", stock: 10 },
    ],
    tags: ["sunglasses", "polarized", "retro", "accessories"],
    weight: 60,
    dimensions: "14 x 5 x 4 cm",
    specifications: [
      { key: "Lens", value: "Polarized UV400" },
      { key: "Frame", value: "Acetate" },
      { key: "Case", value: "Included" },
    ],
  },
  {
    name: "ProChef Non-Stick Cookware Set",
    sku: "HOME-PROCHEF-201",
    category: "Cookware",
    brand: "ProChef",
    price: 4999,
    salePrice: 3499,
    shortDescription: "10-piece non-stick cookware set with induction-compatible base.",
    description:
      "Outfit your kitchen with the ProChef 10-piece set: fry pans, saucepans, a casserole, and utensils. The granite non-stick coating needs little oil, cleans in seconds, and works on all hob types including induction.",
    imageId: "photo-1556911220-bff31c812dba",
    stock: 28,
    featured: true,
    bestSeller: true,
    tags: ["kitchen", "cookware", "non-stick", "home"],
    weight: 4200,
    dimensions: "Packaged 45 x 32 x 18 cm",
    specifications: [
      { key: "Pieces", value: "10" },
      { key: "Coating", value: "Granite non-stick" },
      { key: "Compatibility", value: "All hobs incl. induction" },
      { key: "Handle", value: "Cool-touch" },
    ],
  },
  {
    name: "Savor 5-Speed Stand Mixer",
    sku: "HOME-SAVOR-202",
    category: "Kitchen Appliances",
    brand: "Savor",
    price: 8999,
    salePrice: 6999,
    shortDescription: "1000W stand mixer with 5 speeds, dough hook and 5-litre bowl.",
    description:
      "Whisk, knead, and mix like a pro. The Savor Stand Mixer packs a powerful 1000W motor, 5 speed settings, and a 5-litre stainless bowl — perfect for bread, cakes, and family-sized batches.",
    imageId: "photo-1570222094114-d054a817e56b",
    stock: 18,
    tags: ["mixer", "kitchen", "appliances", "baking"],
    weight: 5500,
    dimensions: "38 x 26 x 36 cm",
    specifications: [
      { key: "Power", value: "1000W" },
      { key: "Speeds", value: "5 + pulse" },
      { key: "Bowl", value: "5 L stainless steel" },
    ],
  },
  {
    name: "AeroBlend Smoothie Blender",
    sku: "HOME-AERO-203",
    category: "Kitchen Appliances",
    brand: "Savor",
    price: 2999,
    salePrice: 2199,
    shortDescription: "1200W personal blender with 6 stainless blades and travel cups.",
    description:
      "Blend smoothies, shakes, and soups in seconds. The AeroBlend Blender's 1200W motor and 6 stainless-steel blades crush ice with ease. Includes two BPA-free travel cups.",
    imageId: "photo-1544145945-f90425340c7e",
    stock: 40,
    newArrival: true,
    tags: ["blender", "kitchen", "smoothie", "appliances"],
    weight: 1800,
    dimensions: "30 x 15 x 15 cm",
    specifications: [
      { key: "Power", value: "1200W" },
      { key: "Blades", value: "6 stainless steel" },
      { key: "Cups", value: "2 x 600 ml BPA-free" },
    ],
  },
  {
    name: "CloudLuxe Mattress Topper",
    sku: "HOME-CLOUD-204",
    category: "Home Decor",
    brand: "CozyNest",
    price: 2499,
    salePrice: 1799,
    shortDescription: "Cooling gel memory-foam topper that turns any bed into a cloud.",
    description:
      "Upgrade your sleep with the CloudLuxe Mattress Topper. Cooling gel-infused memory foam conforms to your body, relieves pressure points, and keeps you cool all night. Fits queen-size beds.",
    imageId: "photo-1507473885765-e6ed057f782c",
    stock: 22,
    tags: ["bedding", "memory foam", "sleep", "home"],
    weight: 3000,
    dimensions: "Queen (160 x 200 cm)",
    specifications: [
      { key: "Fill", value: "Gel-infused memory foam" },
      { key: "Size", value: "Queen 160 x 200 cm" },
      { key: "Cover", value: "Soft brushed knit" },
    ],
  },
  {
    name: "Ergonomic Office Chair",
    sku: "HOME-ERGO-205",
    category: "Furniture",
    brand: "CozyNest",
    price: 8999,
    salePrice: 6999,
    shortDescription: "Breathable mesh office chair with lumbar support and 4D armrests.",
    description:
      "Work comfortably for hours. The Ergonomic Office Chair offers breathable mesh backrest, adjustable lumbar support, 4D armrests, and a synchro-tilt mechanism with 135° recline.",
    imageId: "photo-1567538096630-e0c55bd6374c",
    stock: 16,
    tags: ["chair", "office", "furniture", "ergonomic"],
    weight: 13000,
    dimensions: "66 x 66 x 115 cm",
    specifications: [
      { key: "Frame", value: "Reinforced nylon" },
      { key: "Recline", value: "Up to 135°" },
      { key: "Weight Capacity", value: "150 kg" },
    ],
  },
  {
    name: "Velvet Elegance Perfume",
    sku: "BEAUTY-VELVET-301",
    category: "Fragrances",
    brand: "Maison Lumière",
    price: 3499,
    salePrice: 2699,
    shortDescription: "Eau de parfum with notes of jasmine, amber and vanilla.",
    description:
      "A signature scent that lingers. Velvet Elegance opens with fresh jasmine, warms into amber, and finishes with creamy vanilla. Long-lasting eau de parfum, 50ml.",
    imageId: "photo-1523293182086-7651a899d37f",
    stock: 50,
    featured: true,
    tags: ["perfume", "fragrance", "beauty", "luxury"],
    weight: 200,
    dimensions: "8 x 5 x 5 cm",
    specifications: [
      { key: "Type", value: "Eau de Parfum" },
      { key: "Size", value: "50 ml" },
      { key: "Notes", value: "Jasmine, amber, vanilla" },
    ],
  },
  {
    name: "HydraGlow Vitamin C Serum",
    sku: "BEAUTY-HYDRA-302",
    category: "Skincare",
    brand: "GlowLab",
    price: 1199,
    salePrice: 849,
    shortDescription: "10% vitamin C serum for brighter, even-toned skin.",
    description:
      "Wake up to glowing skin. The HydraGlow Serum combines 10% vitamin C, hyaluronic acid, and vitamin E to brighten skin, reduce dark spots, and boost hydration. Dermatologically tested.",
    imageId: "photo-1556228720-195a672e8a03",
    stock: 65,
    bestSeller: true,
    newArrival: true,
    tags: ["skincare", "vitamin c", "serum", "beauty"],
    weight: 50,
    dimensions: "4 x 4 x 10 cm",
    specifications: [
      { key: "Volume", value: "30 ml" },
      { key: "Key Actives", value: "10% Vitamin C, Hyaluronic Acid" },
      { key: "Skin Type", value: "All skin types" },
    ],
  },
  {
    name: "ProGrip Yoga Mat",
    sku: "SPORT-YOGA-401",
    category: "Yoga",
    brand: "FlexLife",
    price: 1999,
    salePrice: 1499,
    shortDescription: "6mm anti-slip TPE yoga mat with carry strap.",
    description:
      "Find your flow on a mat that stays put. The ProGrip Yoga Mat features a 6mm TPE layer for cushioning and a textured anti-slip surface for confidence in every pose. Includes carry strap.",
    imageId: "photo-1575052814086-f385e2e2ad1b",
    stock: 48,
    tags: ["yoga", "fitness", "mat", "sports"],
    weight: 850,
    dimensions: "183 x 61 x 0.6 cm",
    specifications: [
      { key: "Material", value: "TPE" },
      { key: "Thickness", value: "6 mm" },
      { key: "Accessories", value: "Carry strap included" },
    ],
  },
  {
    name: "Titan Pro Dumbbell Set",
    sku: "SPORT-TITAN-402",
    category: "Fitness",
    brand: "FlexLife",
    price: 4999,
    salePrice: 3999,
    shortDescription: "20kg adjustable dumbbell set with locking clips.",
    description:
      "Build strength at home with the Titan Pro Dumbbell Set. Includes two 10kg dumbbells, four lockable collars, and anti-slip grips. Perfect for full-body home workouts.",
    imageId: "photo-1583454110551-21f2fa2afe61",
    stock: 20,
    tags: ["dumbbells", "fitness", "gym", "home workout"],
    weight: 20000,
    dimensions: "45 x 15 x 12 cm",
    specifications: [
      { key: "Weight", value: "2 x 10 kg (20 kg total)" },
      { key: "Grip", value: "Anti-slip knurled" },
      { key: "Collars", value: "4 lockable" },
    ],
  },
  {
    name: "The Art of Minimal Living (Book)",
    sku: "BOOKS-MINIMAL-501",
    category: "Books",
    brand: "MindPress",
    price: 799,
    salePrice: 549,
    shortDescription: "A practical guide to decluttering your home and mind.",
    description:
      "Bestselling guide to living with less. Learn the practical steps to declutter your space, reduce stress, and focus on what truly matters. Paperback, 256 pages.",
    imageId: "photo-1544947950-fa07a98d237f",
    stock: 100,
    bestSeller: true,
    tags: ["book", "self-help", "minimalism"],
    weight: 320,
    dimensions: "21 x 14 x 2 cm",
    specifications: [
      { key: "Pages", value: "256" },
      { key: "Format", value: "Paperback" },
      { key: "Language", value: "English" },
    ],
  },
  {
    name: "Eternal Love Sterling Ring",
    sku: "JEWEL-ETERNAL-601",
    category: "Jewellery",
    brand: "Lumina",
    price: 5999,
    salePrice: 4499,
    shortDescription: "925 sterling silver ring with cubic zirconia stone.",
    description:
      "A timeless piece for everyday elegance. The Eternal Love Ring is crafted from 925 sterling silver with a brilliant cubic zirconia centre stone. Hypoallergenic and tarnish-resistant.",
    imageId: "photo-1605100804763-247f67b3557e",
    stock: 30,
    featured: true,
    variants: [
      { size: "6", stock: 10 },
      { size: "7", stock: 10 },
      { size: "8", stock: 10 },
    ],
    tags: ["ring", "silver", "jewellery", "gift"],
    weight: 4,
    dimensions: "",
    specifications: [
      { key: "Material", value: "925 Sterling Silver" },
      { key: "Stone", value: "Cubic Zirconia" },
      { key: "Hypoallergenic", value: "Yes" },
    ],
  },
  {
    name: "Rose Gold Minimalist Necklace",
    sku: "JEWEL-ROSE-602",
    category: "Jewellery",
    brand: "Lumina",
    price: 2499,
    salePrice: 1799,
    shortDescription: "Delicate rose-gold plated pendant necklace with bar design.",
    description:
      "The perfect layering piece. This minimalist bar necklace is rose-gold plated over sterling silver, finished with a secure lobster clasp.",
    imageId: "photo-1599643478518-a784e5dc4c8f",
    stock: 35,
    newArrival: true,
    tags: ["necklace", "rose gold", "jewellery", "women"],
    weight: 3,
    dimensions: "",
    specifications: [
      { key: "Material", value: "Rose-gold plated sterling silver" },
      { key: "Length", value: "42 cm + 5 cm extender" },
      { key: "Clasp", value: "Lobster" },
    ],
  },
];

const REVIEWS: Record<string, { rating: number; title: string; comment: string }[]> = {
  "ELEC-AURORA-001": [
    { rating: 5, title: "Incredible sound", comment: "The noise cancellation is superb and battery truly lasts days. Best purchase this year." },
    { rating: 4, title: "Great value", comment: "Comfortable for long calls. Would have liked a better case." },
    { rating: 5, title: "Love them", comment: "Deep bass and crystal clear calls. Highly recommend." },
  ],
  "ELEC-APEX-002": [
    { rating: 4, title: "Great watch", comment: "Tracks everything accurately. Battery lasts about 8 days for me." },
    { rating: 5, title: "Excellent screen", comment: "The AMOLED display is gorgeous even in sunlight." },
  ],
  "ELEC-NOVA-005": [
    { rating: 5, title: "Camera beast", comment: "Night mode photos are incredible for this price." },
    { rating: 4, title: "Solid phone", comment: "Fast, smooth, and the battery charges super quick." },
  ],
  "FASH-DENIM-101": [
    { rating: 5, title: "Perfect fit", comment: "Runs true to size and the wash is exactly like the photos." },
    { rating: 4, title: "Nice jacket", comment: "Good quality denim, a bit stiff at first but softens up." },
  ],
  "FASH-VELOCITY-103": [
    { rating: 5, title: "Super comfortable", comment: "Ran a half marathon on the first wear, zero blisters." },
    { rating: 4, title: "Lightweight", comment: "Very breathable. Slightly narrow for wide feet." },
  ],
  "HOME-PROCHEF-201": [
    { rating: 5, title: "Great set", comment: "Non-stick is genuinely non-stick and works on my induction hob." },
    { rating: 4, title: "Good value", comment: "Handles get slightly warm but overall excellent set." },
  ],
  "BEAUTY-HYDRA-302": [
    { rating: 5, title: "Skin looks brighter", comment: "Two weeks in and my dark spots have visibly faded." },
    { rating: 4, title: "Good serum", comment: "Absorbs fast, no stickiness. A little goes a long way." },
  ],
  "BOOKS-MINIMAL-501": [
    { rating: 5, title: "Life changing", comment: "Easy to read and full of actionable steps. Highly recommended." },
    { rating: 4, title: "Inspiring", comment: "Great practical tips for beginners to minimalism." },
  ],
};

async function main() {
  console.log("Seeding database...");

  // ----- Users -----
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const customerPassword = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@novacart.in" },
    update: {},
    create: {
      email: "admin@novacart.in",
      passwordHash: adminPassword,
      name: "Store Admin",
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
      phone: "+91 98765 43210",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPassword,
      name: "Demo Customer",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: true,
      phone: "+91 90000 00000",
      cart: { create: {} },
      wishlist: { create: {} },
      addresses: {
        create: [
          {
            label: "Home",
            fullName: "Demo Customer",
            phone: "+91 90000 00000",
            line1: "42, MG Road",
            line2: "Indiranagar",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560038",
            country: "India",
            isDefault: true,
          },
          {
            label: "Work",
            fullName: "Demo Customer",
            phone: "+91 90000 00000",
            line1: "Level 9, Tech Park",
            line2: "Whitefield",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560066",
            country: "India",
            isDefault: false,
          },
        ],
      },
    },
  });

  console.log("  ✓ users (admin: admin@novacart.in, customer: customer@example.com)");

  // ----- Categories -----
  const categoryDefs: { name: string; children?: string[] }[] = [
    { name: "Electronics", children: ["Mobiles", "Laptops", "Headphones", "Audio", "Cameras", "Wearables"] },
    { name: "Fashion", children: ["T-Shirts", "Jackets", "Shoes", "Bags", "Accessories"] },
    { name: "Home & Kitchen", children: ["Cookware", "Kitchen Appliances", "Furniture", "Home Decor"] },
    { name: "Beauty & Personal Care", children: ["Skincare", "Fragrances"] },
    { name: "Sports & Fitness", children: ["Fitness", "Yoga"] },
    { name: "Books", children: [] },
    { name: "Jewellery", children: [] },
  ];

  const categories = new Map<string, { id: string; slug: string }>();
  let order = 0;
  for (const def of categoryDefs) {
    const parent = await prisma.category.upsert({
      where: { slug: def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: { isActive: true, sortOrder: order },
      create: {
        name: def.name,
        slug: def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sortOrder: order,
        isActive: true,
      },
    });
    categories.set(def.name, { id: parent.id, slug: parent.slug });
    order += 1;

    for (const child of def.children || []) {
      const childRow = await prisma.category.upsert({
        where: { slug: child.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        update: { isActive: true, parentId: parent.id },
        create: {
          name: child,
          slug: child.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          parentId: parent.id,
          isActive: true,
        },
      });
      categories.set(child, { id: childRow.id, slug: childRow.slug });
    }
  }
  console.log(`  ✓ categories (${categories.size})`);

  // ----- Brands -----
  const brandDefs = [
    "SoundWave", "Apex", "NovaTech", "OptiShot", "UrbanWear", "StrideX",
    "ProChef", "Savor", "CozyNest", "Maison Lumière", "GlowLab", "FlexLife",
    "MindPress", "Lumina",
  ];
  const brands = new Map<string, { id: string; slug: string }>();
  for (const name of brandDefs) {
    const b = await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: { isActive: true },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), isActive: true },
    });
    brands.set(name, { id: b.id, slug: b.slug });
  }
  console.log(`  ✓ brands (${brands.size})`);

  // ----- Products -----
  for (const p of PRODUCTS) {
    const cat = categories.get(p.category);
    const brand = brands.get(p.brand);
    if (!cat) {
      console.warn(`  ! category not found for ${p.name} (${p.category})`);
      continue;
    }
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug },
        data: {
          price: paise(p.price),
          salePrice: p.salePrice ? paise(p.salePrice) : null,
          stock: p.stock,
          isActive: true,
        },
      });
      console.log(`  ~ updated ${p.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        price: paise(p.price),
        salePrice: p.salePrice ? paise(p.salePrice) : null,
        categoryId: cat.id,
        brandId: brand?.id,
        stock: p.stock,
        weight: p.weight,
        dimensions: p.dimensions,
        specifications: p.specifications ? JSON.stringify(p.specifications) : null,
        tags: p.tags ? JSON.stringify(p.tags) : null,
        isFeatured: p.featured ?? false,
        isBestSeller: p.bestSeller ?? false,
        isNewArrival: p.newArrival ?? false,
        isActive: true,
        videoUrl: null,
        images: {
          create: [
            { url: img(p.imageId), alt: p.name, sortOrder: 0 },
            { url: img(p.imageId), alt: `${p.name} (view 2)`, sortOrder: 1 },
          ],
        },
        variants: p.variants
          ? {
              create: p.variants.map((v, i) => ({
                sku: `${p.sku}-V${i + 1}`,
                size: v.size,
                color: v.color,
                price: paise(p.price),
                salePrice: v.salePrice ? paise(v.salePrice) : p.salePrice ? paise(p.salePrice) : null,
                stock: v.stock,
                isActive: true,
              })),
            }
          : undefined,
      },
    });
    console.log(`  ✓ created ${p.name}`);
  }

  // ----- Reviews (only for a couple of products, linked to demo customer) -----
  for (const [sku, reviews] of Object.entries(REVIEWS)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) continue;
    for (const r of reviews) {
      const exists = await prisma.review.findUnique({
        where: { userId_productId: { userId: customer.id, productId: product.id } },
      });
      if (exists) continue;
      await prisma.review.create({
        data: {
          userId: customer.id,
          productId: product.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          status: "APPROVED",
          isVerifiedPurchase: true,
        },
      });
    }
  }
  console.log("  ✓ reviews");

  // ----- Shipping methods -----
  const shippingDefs = [
    { name: "Standard Delivery", price: 4900, estimatedDays: "4-6 business days", sortOrder: 0 },
    { name: "Express Delivery", price: 9900, estimatedDays: "2-3 business days", sortOrder: 1 },
  ];
  for (const s of shippingDefs) {
    const existingShipping = await prisma.shippingMethod.findFirst({ where: { name: s.name } });
    if (existingShipping) {
      await prisma.shippingMethod.update({
        where: { id: existingShipping.id },
        data: { price: s.price, isActive: true },
      });
    } else {
      await prisma.shippingMethod.create({ data: { ...s, isActive: true } });
    }
  }
  console.log("  ✓ shipping methods");

  // ----- Coupons -----
  const coupons = [
    { code: "WELCOME10", type: "PERCENT", value: 10, minOrderAmount: paise(499), maxDiscountAmount: paise(100), maxUses: 1000, description: "10% off your first order (min ₹499, max ₹100)" },
    { code: "SAVE500", type: "FIXED", value: paise(500), minOrderAmount: paise(1999), maxUses: 500, description: "Flat ₹500 off on orders above ₹1,999" },
    { code: "FLAT20", type: "PERCENT", value: 20, minOrderAmount: paise(299), maxDiscountAmount: paise(200), maxUses: 800, description: "20% off up to ₹200 (min ₹299)" },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { isActive: true, description: c.description },
      create: { ...c, isActive: true, usedCount: 0, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
  }
  console.log("  ✓ coupons");

  // ----- Settings -----
  const settings: Record<string, string> = {
    storeName: "NovaCart",
    storeTagline: "Everything you love, delivered to your door",
    supportEmail: "support@novacart.in",
    supportPhone: "+91 98765 43210",
    address: "Sector 62, Noida, Uttar Pradesh, India",
    freeShippingThreshold: String(paise(499)),
    taxRate: "0",
    announcement: "Free shipping on all orders above ₹499! Use code WELCOME10 for 10% off.",
    announcementEnabled: "true",
    heroTitle: "Up to 50% off on Electronics & Fashion",
    heroSubtitle: "Discover the best deals on premium products with fast, free delivery on orders above ₹499.",
    heroImage: "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("  ✓ settings");

  console.log("\nSeed complete!");
  console.log("Admin login:    admin@novacart.in / Admin@123");
  console.log("Customer login: customer@example.com / Customer@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });