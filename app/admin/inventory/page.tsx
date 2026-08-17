"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, PackageX, Pencil, Warehouse } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle } from "@/components/admin/ui";

interface InvItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category: string | null;
  brand: string | null;
  image: string | null;
}

export default function AdminInventoryPage() {
  const { showToast } = useShop();
  const [lowStock, setLowStock] = useState<InvItem[]>([]);
  const [outOfStock, setOutOfStock] = useState<InvItem[]>([]);
  const [summary, setSummary] = useState<{ total: number; withStock: number; lowStock: number; outOfStock: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<{ lowStock: InvItem[]; outOfStock: InvItem[]; summary: any }>("/api/admin/inventory");
      setLowStock(res.lowStock);
      setOutOfStock(res.outOfStock);
      setSummary(res.summary);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (id: string) => {
    if (newStock === "") return;
    try {
      const res = await api<{ product: any }>(`/api/admin/products/${id}`);
      const p = res.product;
      await api(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: {
          name: p.name, sku: p.sku, price: p.price, salePrice: p.salePrice, categoryId: p.categoryId,
          brandId: p.brandId, stock: Number(newStock), isActive: p.isActive, isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, shortDescription: p.shortDescription,
          description: p.description, specifications: p.specifications || [], tags: p.tags || [],
          images: p.images || [], variants: p.variants || [],
        },
      });
      showToast("Stock updated");
      setEditingId(null);
      setNewStock("");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not update stock", "error");
    }
  };

  const renderItem = (item: InvItem) => (
    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
        ) : (
          <Warehouse className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/products/${item.id}`} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-brand-600">
          {item.name}
        </Link>
        <p className="text-xs text-gray-400">{item.sku} · {item.category || "—"}{item.brand ? ` · ${item.brand}` : ""}</p>
      </div>
      {editingId === item.id ? (
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={newStock} onChange={(e) => setNewStock(e.target.value)} className="input w-24" autoFocus />
          <button onClick={() => updateStock(item.id)} className="btn-primary px-3 py-2 text-xs">Save</button>
          <button onClick={() => { setEditingId(null); setNewStock(""); }} className="btn-secondary px-3 py-2 text-xs">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {item.stock === 0 ? "Out of stock" : `${item.stock} in stock`}
          </span>
          <button
            onClick={() => { setEditingId(item.id); setNewStock(String(item.stock)); }}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-brand-300 hover:text-brand-600"
            aria-label="Update stock"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (loading || !summary) return <p className="py-10 text-center text-gray-400">Loading...</p>;

  return (
    <div>
      <PageTitle title="Inventory" subtitle="Monitor stock levels and restock products." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary.withStock}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Low Stock (≤5)</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{summary.lowStock}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-600">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{summary.outOfStock}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-700">
          <AlertTriangle className="h-5 w-5" /> Low Stock
        </h2>
        <div className="space-y-3">
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing running low. Great job!</p>
          ) : (
            lowStock.map(renderItem)
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-red-600">
          <PackageX className="h-5 w-5" /> Out of Stock
        </h2>
        <div className="space-y-3">
          {outOfStock.length === 0 ? (
            <p className="text-sm text-gray-400">No products are out of stock.</p>
          ) : (
            outOfStock.map(renderItem)
          )}
        </div>
      </div>
    </div>
  );
}