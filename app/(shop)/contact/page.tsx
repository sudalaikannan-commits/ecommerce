"use client";

import { Loader2, Mail, MessageSquare, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ContactPage() {
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/contact", { method: "POST", body: form });
      setSent(true);
    } catch (err: any) {
      showToast(err.message || "Could not send message", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Contact Us" subtitle="We'd love to hear from you. Get in touch with our support team." />

      <div className="container-x py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="card p-8">
            {sent ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-14 w-14 text-green-500" />
                <h2 className="mt-4 text-xl font-bold text-gray-900">Message sent!</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Thank you for contacting us. Our team will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input min-h-[140px] resize-y" />
                </div>
                <button type="submit" disabled={busy} className="btn-primary px-8">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="card flex items-start gap-4 p-6">
              <div className="rounded-xl bg-brand-50 p-3">
                <MapPin className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Visit Us</h3>
                <p className="mt-1 text-sm text-gray-600">
                  123 Commerce Street, Tech Park<br />
                  Bengaluru, Karnataka 560001, India
                </p>
              </div>
            </div>
            <div className="card flex items-start gap-4 p-6">
              <div className="rounded-xl bg-brand-50 p-3">
                <Phone className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Call Us</h3>
                <p className="mt-1 text-sm text-gray-600">+91 86800 60912</p>
                <p className="text-sm text-gray-500">Mon–Sat, 10am–7pm IST</p>
              </div>
            </div>
            <div className="card flex items-start gap-4 p-6">
              <div className="rounded-xl bg-brand-50 p-3">
                <Mail className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Us</h3>
                <p className="mt-1 text-sm text-gray-600">hello@ationicagency.com</p>
                <p className="text-sm text-gray-500">We reply within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}