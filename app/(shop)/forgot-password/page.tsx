"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";

export default function ForgotPasswordPage() {
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err: any) {
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">Check your inbox</h1>
              <p className="mt-2 text-sm text-gray-600">
                If an account exists for <span className="font-medium">{email}</span>, we&apos;ve
                sent you a link to reset your password. The link expires in 1 hour.
              </p>
              <Link href="/login" className="btn-primary mt-6">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-gray-900">Forgot your password?</h1>
              <p className="mt-1 text-center text-sm text-gray-500">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-9"
                    />
                  </div>
                </div>
                <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                  {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-gray-600">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}