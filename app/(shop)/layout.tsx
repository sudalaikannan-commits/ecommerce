import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings } from "@/lib/settings";
import { getCategoriesTree } from "@/lib/store";

export const metadata: Metadata = {
  title: {
    default: "NovaCart — Shop Electronics, Fashion & More",
    template: "%s | NovaCart",
  },
};

export const dynamic = "force-dynamic";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([getSettings(), getCategoriesTree()]);

  const headerSettings = {
    storeName: settings.storeName,
    storeTagline: settings.storeTagline,
    announcement: settings.announcement,
    announcementEnabled: settings.announcementEnabled,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header settings={headerSettings} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={headerSettings} />
    </div>
  );
}