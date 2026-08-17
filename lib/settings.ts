import { prisma } from "./prisma";
import { parseJson } from "./utils";

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  freeShippingThreshold: number; // paise; 0 = never free
  taxRate: number; // percentage
  announcement: string;
  announcementEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
}

const DEFAULTS: StoreSettings = {
  storeName: "NovaCart",
  storeTagline: "Everything you love, delivered to your door",
  supportEmail: "support@novacart.in",
  supportPhone: "+91 98765 43210",
  address: "Sector 62, Noida, Uttar Pradesh, India",
  freeShippingThreshold: 49900, // ₹499
  taxRate: 0,
  announcement: "",
  announcementEnabled: false,
  heroTitle: "Up to 50% off on Electronics & Fashion",
  heroSubtitle: "Discover the best deals on premium products with fast, free delivery on orders above ₹499.",
  heroImage: "",
};

let cache: Record<string, string> | null = null;

export async function getSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value ?? "";
  cache = map;
  return normalizeSettings(map);
}

export function normalizeSettings(map: Record<string, string>): StoreSettings {
  const settings = { ...DEFAULTS };
  const assign = <K extends keyof StoreSettings>(key: K, parse?: (v: string) => StoreSettings[K]) => {
    const raw = map[key as string];
    if (raw === undefined || raw === null || raw === "") return;
    settings[key] = parse ? parse(raw) : (raw as StoreSettings[K]);
  };
  assign("storeName");
  assign("storeTagline");
  assign("supportEmail");
  assign("supportPhone");
  assign("address");
  assign("freeShippingThreshold", (v) => parseInt(v, 10) || 0);
  assign("taxRate", (v) => parseInt(v, 10) || 0);
  assign("announcement");
  assign("announcementEnabled", (v) => v === "true");
  assign("heroTitle");
  assign("heroSubtitle");
  assign("heroImage");
  return settings;
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache = null;
}

export function getParsed<T>(map: Record<string, string>, key: string, fallback: T): T {
  return parseJson(map[key], fallback);
}