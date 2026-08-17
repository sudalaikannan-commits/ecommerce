"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { EmptyState, PageLoader } from "@/components/ui";
import { AddressFormModal, type AddressData } from "@/components/account/AddressFormModal";

export default function AddressesPage() {
  const { showToast } = useShop();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AddressData | null>(null);

  const load = async () => {
    try {
      const res = await api<{ addresses: AddressData[] }>("/api/account/addresses");
      setAddresses(res.addresses);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSaved = (addr: AddressData) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === addr.id);
      const next = exists ? prev.map((a) => (a.id === addr.id ? addr : a)) : [...prev, addr];
      if (addr.isDefault) return next.map((a) => ({ ...a, isDefault: a.id === addr.id }));
      return next;
    });
    setShowForm(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await api(`/api/account/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast("Address deleted");
    } catch (err: any) {
      showToast(err.message || "Could not delete address", "error");
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api(`/api/account/addresses/${id}`, { method: "PATCH", body: { isDefault: true } });
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      showToast("Default address updated");
    } catch (err: any) {
      showToast(err.message || "Could not update address", "error");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <MapPin className="h-5 w-5 text-brand-600" /> Saved Addresses
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus className="mr-1 inline h-4 w-4" /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="No addresses saved" description="Add an address to speed up checkout." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="card relative p-5">
              {addr.isDefault && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  <Star className="h-3 w-3 fill-current" /> Default
                </span>
              )}
              <span className="chip bg-gray-100 text-gray-600">{addr.label}</span>
              <p className="mt-2 text-sm font-semibold text-gray-900">{addr.fullName}</p>
              <p className="text-sm text-gray-600">{addr.line1}</p>
              {addr.line2 && <p className="text-sm text-gray-600">{addr.line2}</p>}
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
              <p className="text-sm text-gray-500">{addr.country} · {addr.phone}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => {
                    setEditing(addr);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr.id)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Set default
                  </button>
                )}
                <button
                  onClick={() => remove(addr.id)}
                  className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        address={editing}
        onSaved={onSaved}
      />
    </div>
  );
}