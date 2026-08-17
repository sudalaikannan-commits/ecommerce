"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Boxes, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, StatusBadge, Toggle } from "@/components/admin/ui";
import { Pagination } from "@/components/shop/Pagination";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  image: string | null;
  category: string | null;
  brand: string | null;
  variantCount: number;
}

export default function AdminProductsPage() {
  const { showToast } = useShop();
  const [products, setProducts] = useState<ProductRow[]>([]);
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
      const res = await api<{ products: ProductRow[]; total: number; totalPages: number }>(`/api/admin/products?${params}`);
      setProducts(res.products);
      setTotal(res.total);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const toggleActive = async (p: ProductRow) => {
    setBusyId(p.id);
    try {
      await api(`/api/admin/products/${p.id}/status`, {
        method: "PATCH",
        body: { isActive: !p.isActive },
      });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)));
      showToast(p.isActive ? "Product deactivated" : "Product activated");
    } catch (err: any) {
      showToast(err.message || "Could not update product", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product permanently? This cannot be undone.")) return;
    try {
      await api(`/api/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted");
    } catch (err: any) {
      showToast(err.message || "Could not delete product", "error");
    }
  };

  return (
    <div>
      <PageTitle
        title="Products"
        subtitle={`${total} products in store`}
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="mr-1.5 inline h-4 w-4" /> Add Product
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search name, SKU..."
            className="input w-64 pl-9"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-40">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" sizes="44px" />}
                        {!p.image && <Boxes className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku} {p.variantCount > 0 && `· ${p.variantCount} variants`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.salePrice != null ? (
                      <div>
                        <p className="font-semibold text-gray-900">{formatPrice(p.salePrice)}</p>
                        <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900">{formatPrice(p.price)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.stock === 0 ? "BLOCKED" : p.stock <= 5 ? "PENDING" : "ACTIVE"} />
                    <span className="ml-1 text-xs text-gray-500">{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.category || <span className="text-gray-300">—</span>}
                    {p.brand && <span className="text-xs text-gray-400"> · {p.brand}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={p.isActive} onChange={() => toggleActive(p)} disabled={busyId === p.id} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-brand-300 hover:text-brand-600" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(p.id)} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-300 hover:text-red-500" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
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