"use client";

import { useEffect, useState } from "react";
import { Search, UserX, UserCheck } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/shop/Pagination";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  orderCount: number;
  reviewCount: number;
}

export default function AdminCustomersPage() {
  const { showToast } = useShop();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await api<{ customers: Customer[]; total: number }>(`/api/admin/customers?${params}`);
      setCustomers(res.customers);
      setTotal(res.total);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const toggleBlock = async (c: Customer) => {
    if (!confirm(c.status === "BLOCKED" ? `Unblock ${c.name}?` : `Block ${c.name}?`)) return;
    setBusyId(c.id);
    try {
      const newStatus = c.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
      await api(`/api/admin/customers/${c.id}`, { method: "PATCH", body: { status: newStatus } });
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)));
      showToast(c.status === "BLOCKED" ? "Customer unblocked" : "Customer blocked");
    } catch (err: any) {
      showToast(err.message || "Could not update customer", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageTitle title="Customers" subtitle={`${total} registered customers`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search name, email, phone..." className="input w-72 pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Reviews</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">{c.orderCount}</td>
                  <td className="px-4 py-3">{c.reviewCount}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggleBlock(c)}
                        disabled={busyId === c.id}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          c.status === "BLOCKED"
                            ? "border-green-200 text-green-600 hover:bg-green-50"
                            : "border-red-200 text-red-500 hover:bg-red-50"
                        }`}
                      >
                        {c.status === "BLOCKED" ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        {c.status === "BLOCKED" ? "Unblock" : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />}
    </div>
  );
}