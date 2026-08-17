"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Search, Star, Trash2, X } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/shop/Pagination";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
}

export default function AdminReviewsPage() {
  const { showToast } = useShop();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api<{ reviews: Review[]; total: number }>(`/api/admin/reviews?${params}`);
      setReviews(res.reviews);
      setTotal(res.total);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const setReviewStatus = async (r: Review, newStatus: string) => {
    setBusyId(r.id);
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body: { status: newStatus } });
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: newStatus } : x)));
      showToast(`Review ${newStatus.toLowerCase()}`);
    } catch (err: any) {
      showToast(err.message || "Could not update review", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api(`/api/admin/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Review deleted");
    } catch (err: any) {
      showToast(err.message || "Could not delete review", "error");
    }
  };

  return (
    <div>
      <PageTitle title="Reviews" subtitle={`${total} customer reviews`} />

      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-44">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="py-10 text-center text-gray-400">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="py-10 text-center text-gray-400">No reviews found.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.title && <p className="mt-2 font-semibold text-gray-900">{r.title}</p>}
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{r.user.name}</span> ·{" "}
                    <Link href={`/product/${r.product.slug}`} className="text-brand-600 hover:underline">{r.product.name}</Link> ·{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status !== "APPROVED" && (
                    <button onClick={() => setReviewStatus(r, "APPROVED")} disabled={busyId === r.id} className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {r.status !== "REJECTED" && (
                    <button onClick={() => setReviewStatus(r, "REJECTED")} disabled={busyId === r.id} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {total > 20 && <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />}
    </div>
  );
}