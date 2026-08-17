"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { api, uploadImage } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, Toggle } from "@/components/admin/ui";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  isActive: boolean;
  _count: { products: number };
}

const emptyForm = { name: "", logo: "", description: "", isActive: true };

export default function AdminBrandsPage() {
  const { showToast } = useShop();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const res = await api<{ brands: Brand[] }>("/api/admin/brands");
      setBrands(res.brands);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/admin/brands/${editing.id}`, { method: "PATCH", body: form });
        showToast("Brand updated");
      } else {
        await api("/api/admin/brands", { method: "POST", body: form });
        showToast("Brand created");
      }
      setModal(false);
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not save brand", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    try {
      await api(`/api/admin/brands/${id}`, { method: "DELETE" });
      showToast("Brand deleted");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not delete brand", "error");
    }
  };

  const toggle = async (b: Brand) => {
    try {
      await api(`/api/admin/brands/${b.id}`, { method: "PATCH", body: { name: b.name, logo: b.logo, description: b.description, isActive: !b.isActive } });
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not update brand", "error");
    }
  };

  const onLogo = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, logo: url }));
    } catch (err: any) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageTitle
        title="Brands"
        subtitle="Manage the brands available in your store."
        actions={
          <button onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }} className="btn-primary">
            <Plus className="mr-1.5 inline h-4 w-4" /> Add Brand
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt={b.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-400">{b._count.products} products</p>
                </div>
              </div>
              <Toggle checked={b.isActive} onChange={() => toggle(b)} />
            </div>
            {b.description && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{b.description}</p>}
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button onClick={() => { setEditing(b); setForm({ name: b.name, logo: b.logo || "", description: b.description || "", isActive: b.isActive }); setModal(true); }} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => remove(b.id)} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <form onSubmit={submit} className="relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit Brand" : "Add Brand"}</h3>
              <button type="button" onClick={() => setModal(false)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" />
              </div>
              <div>
                <label className="label">Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logo} alt="Brand logo" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <label className="btn-secondary cursor-pointer">
                    {uploading ? "Uploading..." : "Upload"}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded text-brand-600" />
                Active
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}