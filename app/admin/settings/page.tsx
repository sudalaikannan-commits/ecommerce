"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle, Toggle } from "@/components/admin/ui";

const fields = [
  { key: "storeName", label: "Store Name", type: "text" },
  { key: "storeTagline", label: "Store Tagline", type: "text" },
  { key: "supportEmail", label: "Support Email", type: "email" },
  { key: "supportPhone", label: "Support Phone", type: "text" },
  { key: "address", label: "Address", type: "textarea" },
  { key: "freeShippingThreshold", label: "Free Shipping Threshold (₹, paise)", type: "number" },
  { key: "taxRate", label: "Tax Rate (%)", type: "number" },
  { key: "announcement", label: "Announcement Bar Text", type: "text" },
  { key: "heroTitle", label: "Hero Title (Homepage)", type: "text" },
  { key: "heroSubtitle", label: "Hero Subtitle (Homepage)", type: "textarea" },
  { key: "heroImage", label: "Hero Image URL", type: "text" },
];

export default function AdminSettingsPage() {
  const { showToast } = useShop();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ settings: Record<string, string> }>("/api/admin/settings");
        setSettings(res.settings);
        setAnnouncementEnabled(res.settings.announcementEnabled === "true");
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await api<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PATCH",
        body: { ...settings, announcementEnabled },
      });
      setSettings(res.settings);
      showToast("Settings saved. The storefront has been updated.");
    } catch (err: any) {
      showToast(err.message || "Could not save settings", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-gray-400">Loading...</p>;

  return (
    <div>
      <PageTitle
        title="Store Settings"
        subtitle="These changes instantly reflect across the entire storefront."
        actions={
          <button onClick={save} disabled={busy} className="btn-primary">
            <Save className="mr-1.5 inline h-4 w-4" /> {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save Settings"}
          </button>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 font-semibold text-gray-900">
          <Settings className="h-5 w-5 text-brand-600" /> General
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label className="label">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea value={settings[f.key] || ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} className="input min-h-[80px] resize-y" />
              ) : (
                <input type={f.type} value={settings[f.key] || ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} className="input" />
              )}
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Announcement Bar</p>
              <p className="text-xs text-gray-400">Show the announcement above the header</p>
            </div>
            <Toggle checked={announcementEnabled} onChange={setAnnouncementEnabled} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Need to configure payment gateways or email?</p>
        <p className="mt-1">Set <code className="rounded bg-white px-1.5 py-0.5">RAZORPAY_KEY_ID</code>, <code className="rounded bg-white px-1.5 py-0.5">RAZORPAY_KEY_SECRET</code>, <code className="rounded bg-white px-1.5 py-0.5">STRIPE_SECRET_KEY</code>, <code className="rounded bg-white px-1.5 py-0.5">STRIPE_PUBLISHABLE_KEY</code> and <code className="rounded bg-white px-1.5 py-0.5">SMTP_*</code> in your <code className="rounded bg-white px-1.5 py-0.5">.env</code> file.</p>
      </div>
    </div>
  );
}