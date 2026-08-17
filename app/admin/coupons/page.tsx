"use client";

import { useEffect, useState } from "react";
import { Percent, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, StatusBadge, Toggle } from "@/components/admin/ui";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isUserSpecific: boolean;
  _count: { usages: number };
}

interface Form {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  isUserSpecific: boolean;
}

const emptyForm = (): Form => ({ code: "", description: "", type: "PERCENT", value: "", minOrderAmount: "", maxDiscountAmount: "", maxUses: "", startsAt: "", expiresAt: "", isActive: true, isUserSpecific: false });

export default function AdminCouponsPage() {
  const { showToast } = useShop();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());

  const load = async () => {
    try {
      const res = await api<{ coupons: Coupon[] }>("/api/admin/coupons");
      setCoupons(res.coupons);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      code: form.code,
      description: form.description || null,
      type: form.type,
      value: Number(form.value) || 0,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
      isUserSpecific: form.isUserSpecific,
    };
    try {
      if (editing) {
        await api(`/api/admin/coupons/${editing.id}`, { method: "PATCH", body: payload });
        showToast("Coupon updated");
      } else {
        await api("/api/admin/coupons", { method: "POST", body: payload });
        showToast("Coupon created");
      }
      setModal(false);
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not save coupon", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api(`/api/admin/coupons/${id}`, { method: "DELETE" });
      showToast("Coupon deleted");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not delete coupon", "error");
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      await api(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        body: {
          code: c.code, description: c.description, type: c.type, value: c.value,
          minOrderAmount: c.minOrderAmount, maxDiscountAmount: c.maxDiscountAmount,
          maxUses: c.maxUses, startsAt: c.startsAt, expiresAt: c.expiresAt,
          isActive: !c.isActive, isUserSpecific: c.isUserSpecific,
        },
      });
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not update coupon", "error");
    }
  };

  const isExpired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div>
      <PageTitle
        title="Coupons"
        subtitle="Create discount codes to boost sales."
        actions={
          <button onClick={() => { setEditing(null); setForm(emptyForm()); setModal(true); }} className="btn-primary">
            <Plus className="mr-1.5 inline h-4 w-4" /> Add Coupon
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div key={c.id} className={`rounded-xl border bg-white p-5 shadow-sm ${!c.isActive || isExpired(c) ? "border-gray-200 opacity-70" : "border-brand-200"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Percent className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold uppercase tracking-wide text-gray-900">{c.code}</p>
                  <p className="text-xs text-gray-400">{c.type === "PERCENT" ? `${c.value}% off` : `${formatPrice(c.value)} off`}</p>
                </div>
              </div>
              <Toggle checked={c.isActive} onChange={() => toggle(c)} />
            </div>
            {c.description && <p className="mt-3 text-sm text-gray-500">{c.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {c.minOrderAmount != null && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Min {formatPrice(c.minOrderAmount)}</span>}
              {c.maxDiscountAmount != null && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Cap {formatPrice(c.maxDiscountAmount)}</span>}
              {c.maxUses != null && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{c._count.usages}/{c.maxUses} used</span>}
              {c.isUserSpecific && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">1 per user</span>}
              {isExpired(c) && <StatusBadge status="CANCELLED" />}
            </div>
            {c.expiresAt && <p className="mt-2 text-xs text-gray-400">Expires {new Date(c.expiresAt).toLocaleDateString()}</p>}
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button onClick={() => { setEditing(c); setForm({ code: c.code, description: c.description || "", type: c.type, value: String(c.value), minOrderAmount: c.minOrderAmount != null ? String(c.minOrderAmount) : "", maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : "", maxUses: c.maxUses != null ? String(c.maxUses) : "", startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "", expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "", isActive: c.isActive, isUserSpecific: c.isUserSpecific }); setModal(true); }} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
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
          <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit Coupon" : "Add Coupon"}</h3>
              <button type="button" onClick={() => setModal(false)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Code *</label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input uppercase" placeholder="WELCOME10" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })} className="input">
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className="label">{form.type === "PERCENT" ? "Value (%) *" : "Value (₹, paise) *"}</label>
                <input required type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Min Order Amount</label>
                <input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Max Discount Amount</label>
                <input type="number" min={0} value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Max Uses</label>
                <input type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Valid From</label>
                <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Expires On</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded text-brand-600" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isUserSpecific} onChange={(e) => setForm({ ...form, isUserSpecific: e.target.checked })} className="rounded text-brand-600" />
                Limit to one use per user
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