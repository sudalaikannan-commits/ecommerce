"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";

export interface AddressData {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function AddressFormModal({
  open,
  onClose,
  address,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  address?: AddressData | null;
  onSaved: (address: AddressData) => void;
}) {
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    label: address?.label || "Home",
    fullName: address?.fullName || "",
    phone: address?.phone || "",
    line1: address?.line1 || "",
    line2: address?.line2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "India",
    isDefault: address?.isDefault || false,
  });

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (address) {
        const res = await api<{ address: AddressData }>(`/api/account/addresses/${address.id}`, {
          method: "PATCH",
          body: form,
        });
        showToast("Address updated");
        onSaved(res.address);
      } else {
        const res = await api<{ address: AddressData }>("/api/account/addresses", {
          method: "POST",
          body: form,
        });
        showToast("Address added");
        onSaved(res.address);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || "Could not save address", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {address ? "Edit Address" : "Add New Address"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Label</label>
            <select value={form.label} onChange={(e) => set("label", e.target.value)} className="input">
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Full Name *</label>
            <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className="input" placeholder="Receiver name" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Phone *</label>
            <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+91 98765 43210" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address Line 1 *</label>
            <input required value={form.line1} onChange={(e) => set("line1", e.target.value)} className="input" placeholder="House no., street, area" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address Line 2</label>
            <input value={form.line2} onChange={(e) => set("line2", e.target.value)} className="input" placeholder="Landmark, building (optional)" />
          </div>
          <div>
            <label className="label">City *</label>
            <input required value={form.city} onChange={(e) => set("city", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">State *</label>
            <input required value={form.state} onChange={(e) => set("state", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">PIN Code *</label>
            <input required value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Country</label>
            <input value={form.country} onChange={(e) => set("country", e.target.value)} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            Set as default address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}