"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Package } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader } from "@/components/ui";

interface OrderLite {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: string; productName: string; productSlug: string; image: string | null; quantity: number }[];
}

interface ViewedItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string | null;
}

export default function AccountDashboard() {
  const { user, ready } = useShop();
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [viewed, setViewed] = useState<ViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    (async () => {
      try {
        const [orderRes, viewedRes] = await Promise.all([
          api<{ orders: OrderLite[] }>("/api/account/orders?perPage=5"),
          api<{ items: ViewedItem[] }>("/api/account/recently-viewed"),
        ]);
        setOrders(orderRes.orders);
        setViewed(viewedRes.items);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [ready, user]);

  if (!ready || !user || loading) return <PageLoader />;

  const statusColor = (s: string) =>
    ({ PENDING: "bg-amber-100 text-amber-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-violet-100 text-violet-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" })[s] || "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome back, {user.name.split(" ")[0]}! 👋</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your orders, addresses, wishlist and profile from here.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/account/orders" className="rounded-xl border border-gray-200 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
            <p className="text-2xl font-bold text-brand-600">{orders.length}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">Orders</p>
          </Link>
          <Link href="/account/wishlist" className="rounded-xl border border-gray-200 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
            <p className="text-2xl font-bold text-brand-600">{viewed.length}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">Recent Views</p>
          </Link>
          <Link href="/account/addresses" className="rounded-xl border border-gray-200 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
            <p className="text-2xl font-bold text-brand-600">{user.phone ? "1" : "0"}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">Phone</p>
          </Link>
          <Link href="/account/settings" className="rounded-xl border border-gray-200 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
            <p className="text-2xl font-bold text-brand-600">{user.role === "ADMIN" ? "Admin" : "Customer"}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">Role</p>
          </Link>
        </div>
      </div>

      {orders.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Package className="h-5 w-5 text-brand-600" /> Recent Orders
            </h3>
            <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {order.items[0]?.image && (
                      <Image src={order.items[0].image} alt={order.items[0].productName} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.items.length} item(s) · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${statusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {viewed.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-brand-600" /> Recently Viewed
            </h3>
            <Link href="/shop" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Shop more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {viewed.map((item) => (
              <Link key={item.id} href={`/product/${item.slug}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-cover transition group-hover:scale-105" sizes="120px" />}
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-medium text-gray-700">{item.name}</p>
                <p className="text-xs font-bold text-brand-600">{formatPrice(item.salePrice ?? item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}