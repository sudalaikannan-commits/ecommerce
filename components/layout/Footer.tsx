import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";
import type { HeaderSettings } from "./Header";

const shopLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/offers", label: "Deals & Offers" },
  { href: "/category/electronics", label: "Electronics" },
  { href: "/category/fashion", label: "Fashion" },
  { href: "/category/home-kitchen", label: "Home & Kitchen" },
  { href: "/category/beauty-personal-care", label: "Beauty" },
];

const accountLinks = [
  { href: "/account", label: "My Account" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

const supportLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About Us" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-policy", label: "Returns & Refunds" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer({ settings }: { settings: HeaderSettings }) {
  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="container-x grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">
              N
            </span>
            <span className="text-xl font-extrabold text-white">{settings.storeName}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            {settings.storeTagline}. Shop thousands of products across electronics, fashion, home and more — all with fast delivery and easy returns.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
              {settings.supportPhone || "Sector 62, Noida, India"}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand-400" />
              {settings.supportPhone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-brand-400" />
              {settings.supportEmail}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {shopLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Account</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {accountLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {supportLinks.slice(0, 4).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Stay in the loop</h3>
          <p className="mt-4 text-sm text-gray-400">
            Subscribe for exclusive offers, new arrivals and tips.
          </p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
            {supportLinks.slice(4).map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-gray-300">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p>100% Secure Payments · Easy Returns · Fast Delivery</p>
        </div>
      </div>
    </footer>
  );
}