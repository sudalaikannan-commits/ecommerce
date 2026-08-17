"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";
import { SearchBar } from "./SearchBar";
import { CartDrawer } from "./CartDrawer";

export interface CategoryNav {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  children?: CategoryNav[];
}

export interface HeaderSettings {
  storeName: string;
  storeTagline: string;
  announcement: string;
  announcementEnabled: boolean;
  supportPhone: string;
  supportEmail: string;
}

export function Header({
  settings,
  categories,
}: {
  settings: HeaderSettings;
  categories: CategoryNav[];
}) {
  const router = useRouter();
  const { user, setUser, cartCount, wishlistCount, showToast } = useShop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setMobileOpen(false);
    router.push("/");
    showToast("Logged out successfully.", "info");
  };

  const topLevel = categories.filter((c) => !c.children?.length || c.children.length > 0);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        {settings.announcementEnabled && settings.announcement && (
          <div className="bg-brand-700 px-4 py-2 text-center text-xs font-medium text-white">
            {settings.announcement}
          </div>
        )}

        <div className="container-x flex items-center gap-3 py-3 sm:gap-6">
          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">
              N
            </span>
            <span className="hidden text-xl font-extrabold tracking-tight text-gray-900 sm:block">
              {settings.storeName}
            </span>
          </Link>

          {/* Search - desktop */}
          <div className="hidden flex-1 lg:block">
            <SearchBar />
          </div>

          {/* Icons */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href={user ? "/account" : "/login"}
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-gray-700 hover:bg-gray-100"
              title={user ? "My Account" : "Login / Register"}
            >
              <User className="h-5 w-5" />
              <span className="hidden text-sm font-medium xl:block">
                {user ? user.name.split(" ")[0] : "Account"}
              </span>
            </Link>

            <Link
              href="/account/wishlist"
              className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100"
              title="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search - mobile */}
        <div className="border-t border-gray-100 px-4 pb-3 lg:hidden">
          <SearchBar onNavigate={() => setMobileOpen(false)} />
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden border-t border-gray-100 lg:block">
          <div className="container-x flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1 rounded-md px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                <Menu className="h-4 w-4" /> All Categories <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {catOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-pop">
                  {categories.map((cat) => (
                    <div key={cat.id} className="group relative">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {cat.name}
                        {cat.children?.length ? <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" /> : null}
                      </Link>
                      {cat.children?.length ? (
                        <div className="invisible absolute left-full top-0 z-50 w-56 rounded-xl border border-gray-200 bg-white py-2 opacity-0 shadow-pop transition group-hover:visible group-hover:opacity-100">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.slug}`}
                              onClick={() => setCatOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/shop" className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Shop All
            </Link>
            <Link href="/offers" className="rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
              Deals & Offers
            </Link>
            <Link href="/contact" className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Contact
            </Link>
          </div>
        </nav>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="animate-fade-in border-t border-gray-100 bg-white lg:hidden">
            <nav className="container-x py-2">
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                {user ? (
                  <>
                    <User className="h-4 w-4 text-brand-600" />
                    <span className="font-medium text-gray-900">{user.name}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                        </Link>
                      )}
                      <button onClick={logout} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200">
                        <LogOut className="h-3.5 w-3.5" /> Logout
                      </button>
                    </span>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-1 font-medium text-brand-700">
                    <User className="h-4 w-4" /> Login / Register
                  </Link>
                )}
              </div>

              <Link href="/shop" onClick={() => setMobileOpen(false)} className="block border-b border-gray-100 py-2.5 font-medium text-gray-800">
                Shop All Products
              </Link>
              <Link href="/offers" onClick={() => setMobileOpen(false)} className="block border-b border-gray-100 py-2.5 font-medium text-red-600">
                Deals & Offers
              </Link>
              {topLevel.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block border-b border-gray-100 py-2.5 text-sm font-medium text-gray-700"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/account/wishlist" onClick={() => setMobileOpen(false)} className="block border-b border-gray-100 py-2.5 font-medium text-gray-800">
                My Wishlist
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block border-b border-gray-100 py-2.5 font-medium text-gray-800">
                Contact Us
              </Link>
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}