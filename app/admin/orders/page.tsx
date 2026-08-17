"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/shop/Pagination";

interface OrderRow {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  createdAt: string;
  user: { name: string; email: string };
}

const orderStatuses = ["", "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await api<{ orders: OrderRow[]; total: number }>(`/api/admin/orders?${params}`);
      setOrders(res.orders);
      setTotal(res.total);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div>
      <PageTitle title="Orders" subtitle={`${total} total orders`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search order #, name, email..."
            className="input w-72 pl-9"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-44">
          {orderStatuses.map((s) => (
            <option key={s || "all"} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No orders found.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50/50" onClick={() => (window.location.href = `/admin/orders/${o.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-brand-600">
                      <Package className="h-4 w-4" /> #{o.orderNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.user.name}</p>
                    <p className="text-xs text-gray-400">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.paymentStatus} />
                    <p className="mt-0.5 text-xs text-gray-400">{o.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatPrice(o.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />}
      {orders.length > 0 && <Link href="/admin/orders" className="hidden" aria-hidden>refresh</Link>}
    </div>
  );
}