"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { api, uploadImage } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, Toggle } from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
  children: { id: string; name: string; slug: string; isActive: boolean; _count: { products: number } }[];
}

interface Form {
  name: string;
  description: string;
  image: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm = (): Form => ({ name: "", description: "", image: "", parentId: "", sortOrder: "0", isActive: true });

export default function AdminCategoriesPage() {
  const { showToast } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const res = await api<{ categories: Category[] }>("/api/admin/categories");
      setCategories(res.categories);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setModal(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", image: c.image || "", parentId: c.parentId || "", sortOrder: String(c.sortOrder), isActive: c.isActive });
    setModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/admin/categories/${editing.id}`, { method: "PATCH", body: { ...form, sortOrder: Number(form.sortOrder) || 0 } });
        showToast("Category updated");
      } else {
        await api("/api/admin/categories", { method: "POST", body: { ...form, sortOrder: Number(form.sortOrder) || 0 } });
        showToast("Category created");
      }
      setModal(false);
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not save category", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/api/admin/categories/${id}`, { method: "DELETE" });
      showToast("Category deleted");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not delete category", "error");
    }
  };

  const toggle = async (c: Category) => {
    try {
      await api(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        body: { name: c.name, description: c.description, image: c.image, parentId: c.parentId, sortOrder: c.sortOrder, isActive: !c.isActive },
      });
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not update category", "error");
    }
  };

  const onImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err: any) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const parents = categories.filter((c) => !c.parentId);

  return (
    <div>
      <PageTitle
        title="Categories"
        subtitle="Organize your catalog into browsable categories."
        actions={
          <button onClick={openNew} className="btn-primary">
            <Plus className="mr-1.5 inline h-4 w-4" /> Add Category
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Tags className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c._count.products} products</p>
                </div>
              </div>
              <Toggle checked={c.isActive} onChange={() => toggle(c)} />
            </div>
            {c.description && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{c.description}</p>}
            {c.children.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.children.map((ch) => (
                  <span key={ch.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    {ch.name} ({ch._count.products})
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => remove(c.id)} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600">
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
              <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit Category" : "Add Category"}</h3>
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
                <label className="label">Parent Category</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="input">
                  <option value="">None (Top level)</option>
                  {parents.filter((p) => p.id !== editing?.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" />
              </div>
              <div>
                <label className="label">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="Category" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <label className="btn-secondary cursor-pointer">
                    {uploading ? "Uploading..." : "Upload"}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} className="hidden" />
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