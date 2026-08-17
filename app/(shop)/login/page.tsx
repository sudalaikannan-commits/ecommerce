"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { showToast, setUser, refreshCartCount } = useShop();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: any }>("/api/auth/login", { method: "POST", body: form });
      setUser(res.user);
      refreshCartCount();
      showToast(`Welcome back, ${res.user.name.split(" ")[0]}!`);
      router.push(redirect.startsWith("/") ? redirect : "/account");
    } catch (err: any) {
      showToast(err.message || "Login failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-center text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Log in to your NovaCart account</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input pl-9"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Log In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}