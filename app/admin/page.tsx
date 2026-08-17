"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  IndianRupee,
  Package,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { PageLoader } from "@/components/ui";
import { PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";

interface Stats {
  totalRevenue: number;
  paidRevenue: number;
  orders: number;
  customers: number;
  products: number;
  categories: number;
  brands: number;
  pendingOrders: number;
  lowStock: number;
  outOfStock: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [sales, setSales] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ stats: Stats; recentOrders: RecentOrder[]; salesOverview: { date: string; revenue: number }[] }>("/api/admin/stats");
        setStats(res.stats);
        setRecentOrders(res.recentOrders);
        setSales(res.salesOverview.slice(-14));
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return <PageLoader />;

  const maxRevenue = Math.max(...sales.map((s) => s.revenue), 1);

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="An overview of your store's performance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={IndianRupee} sub={`${formatPrice(stats.paidRevenue)} paid`} />
        <StatCard label="Orders" value={stats.orders} icon={Package} tone="violet" sub={`${stats.pendingOrders} pending`} />
        <StatCard label="Customers" value={stats.customers} icon={Users} tone="green" />
        <StatCard label="Products" value={stats.products} icon={Boxes} tone="amber" sub={`${stats.categories} categories · ${stats.brands} brands`} />
      </div>

      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <Link
          href="/admin/inventory"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Inventory needs attention: {stats.lowStock} low-stock, {stats.outOfStock} out-of-stock products.
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800">
            Review inventory <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Sales (last 14 days)</h3>
          {sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No sales data yet.</p>
          ) : (
            <div className="flex h-40 items-end gap-1.5">
              {sales.map((s) => (
                <div key={s.date} className="group relative flex-1">
                  <div
                    className="rounded-t bg-brand-500 transition group-hover:bg-brand-600"
                    style={{ height: `${Math.max((s.revenue / maxRevenue) * 100, 2)}%` }}
                  />
                  <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
                    {formatPrice(s.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No orders yet.</p>}
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">#{o.orderNumber}</p>
                  <p className="line-clamp-1 text-xs text-gray-500">{o.user.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.orderStatus} />
                  <span className="text-sm font-bold text-gray-900">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}