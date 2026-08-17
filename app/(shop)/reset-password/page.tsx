"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Suspense, useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (form.password !== form.confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: form.password },
      });
      showToast("Password updated. You can now log in.");
      router.push("/login");
    } catch (err: any) {
      showToast(err.message || "Reset failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">Invalid link</h1>
        <p className="mt-2 text-sm text-gray-600">This password reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="btn-primary mt-6">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-gray-900">Set a new password</h1>
      <p className="mt-1 text-center text-sm text-gray-500">Choose a strong password for your account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">New Password *</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
              className="input pl-9"
            />
          </div>
        </div>
        <div>
          <label className="label">Confirm Password *</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat your password"
              className="input pl-9"
            />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading...</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}