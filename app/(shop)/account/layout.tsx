"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Star,
  MapPin,
} from "lucide-react";
import { useEffect } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader } from "@/components/ui";

const links = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/reviews", label: "My Reviews", icon: Star },
  { href: "/account/settings", label: "Profile & Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, setUser, showToast, refreshCartCount } = useShop();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [ready, user, router, pathname]);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    refreshCartCount();
    showToast("Logged out successfully.");
    router.push("/");
  };

  if (!ready || !user) return <PageLoader />;

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">My Account</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <div className="card sticky top-32 p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="line-clamp-1 text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="mt-3 flex items-center gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}