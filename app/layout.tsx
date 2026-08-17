import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/components/providers/ShopProvider";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "NovaCart — Shop Electronics, Fashion & More",
    template: "%s | NovaCart",
  },
  description:
    "NovaCart is a modern e-commerce store offering electronics, fashion, home & kitchen, beauty and more with fast delivery and easy returns.",
  keywords: ["ecommerce", "online shopping", "electronics", "fashion", "NovaCart"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ShopProvider>
          {children}
          <Toaster />
        </ShopProvider>
      </body>
    </html>
  );
}