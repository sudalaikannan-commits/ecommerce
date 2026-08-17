"use client";

import { useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { Suspense, useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";

function AdminLogin() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const { showToast, setUser, refreshCartCount } = useShop();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: any }>("/api/auth/login", { method: "POST", body: form });
      if (res.user.role !== "ADMIN") {
        showToast("This account does not have admin access.", "error");
        return;
      }
      setUser(res.user);
      refreshCartCount();
      showToast("Welcome back, Admin!");
      window.location.assign(next.startsWith("/admin") ? next : "/admin");
    } catch (err: any) {
      showToast(err.message || "Login failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">
            N
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">NovaCart Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Sign in to manage your store</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-gray-900 p-6 shadow-xl">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@novacart.in"
                className="input border-gray-700 bg-gray-800 text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input border-gray-700 bg-gray-800 text-white placeholder-gray-500"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  );
}