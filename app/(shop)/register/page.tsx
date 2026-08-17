"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, Loader2, Lock, Mail, Phone, RefreshCw, ShieldCheck, Smartphone, User } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { OtpInput } from "@/components/auth/OtpInput";

type Phase = "details" | "email" | "phone" | "done";

const STEPS: { key: Phase; label: string }[] = [
  { key: "details", label: "Account Details" },
  { key: "email", label: "Email Verification" },
  { key: "phone", label: "Phone Verification" },
  { key: "done", label: "Complete" },
];

interface Registration {
  registrationId: string;
  regToken: string;
}

function stepIndex(phase: Phase): number {
  if (phase === "details") return 0;
  if (phase === "email") return 1;
  if (phase === "phone") return 2;
  return 3;
}

function useCountdown(target: number | null): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return 0;
  return Math.max(0, Math.floor((target - now) / 1000));
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StepIndicator({ phase }: { phase: Phase }) {
  const current = stepIndex(phase);
  return (
    <ol className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center">
            {i > 0 && (
              <div className={`mx-1 h-0.5 w-6 rounded-full sm:mx-2 sm:w-10 ${done || active ? "bg-brand-500" : "bg-gray-200"}`} />
            )}
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? "bg-brand-600 text-white"
                    : active
                      ? "bg-brand-600 text-white ring-4 ring-brand-100"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`mt-1.5 hidden text-[11px] font-medium sm:block ${active ? "text-brand-700" : done ? "text-gray-700" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { showToast, setUser, refreshCartCount } = useShop();

  const [phase, setPhase] = useState<Phase>("details");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [expireAt, setExpireAt] = useState<number | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const expireIn = useCountdown(expireAt);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const currentStep = stepIndex(phase);

  const startOtpTimer = (expiresInSeconds?: number) => {
    setExpireAt(Date.now() + (expiresInSeconds ?? 600) * 1000);
    setResendIn(30);
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (form.password.length < 8) {
      setAlert({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (form.password !== form.confirm) {
      setAlert({ type: "error", text: "Passwords do not match." });
      return;
    }
    setBusy(true);
    try {
      const res = await api<Registration & { step: string; email: string; expiresInSeconds: number }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { name: form.name, email: form.email, phone: form.phone, password: form.password },
        }
      );
      setRegistration({ registrationId: res.registrationId, regToken: res.regToken });
      setMaskedEmail(res.email);
      setOtp("");
      startOtpTimer(res.expiresInSeconds);
      setPhase("email");
      showToast("Verification code sent to your email.");
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "Registration failed. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async () => {
    if (!registration) return;
    setVerifying(true);
    setAlert(null);
    try {
      const res = await api<{ user?: any; step?: string; phone?: string; expiresInSeconds?: number }>(
        "/api/auth/verify-otp",
        {
          method: "POST",
          body: { registrationId: registration.registrationId, regToken: registration.regToken, channel: "email", otp },
        }
      );
      setOtp("");
      if (res.user) {
        setUser(res.user);
        refreshCartCount();
        setPhase("done");
        showToast("Account created successfully!");
        setTimeout(() => {
          router.push(redirect.startsWith("/") ? redirect : "/account");
        }, 1800);
        return;
      }
      setMaskedPhone(res.phone || "");
      startOtpTimer(res.expiresInSeconds);
      setPhase("phone");
      showToast("Email verified! Code sent to your phone.");
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "Verification failed. Please try again." });
    } finally {
      setVerifying(false);
    }
  };

  const verifyPhone = async () => {
    if (!registration) return;
    setVerifying(true);
    setAlert(null);
    try {
      const res = await api<{ user: any }>("/api/auth/verify-otp", {
        method: "POST",
        body: { registrationId: registration.registrationId, regToken: registration.regToken, channel: "phone", otp },
      });
      setUser(res.user);
      refreshCartCount();
      setOtp("");
      setPhase("done");
      showToast("Account created successfully!");
      setTimeout(() => {
        router.push(redirect.startsWith("/") ? redirect : "/account");
      }, 1800);
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "Verification failed. Please try again." });
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async (channel: "email" | "phone") => {
    if (!registration) return;
    setBusy(true);
    setAlert(null);
    try {
      const res = await api<{ expiresInSeconds?: number; email?: string; phone?: string }>(
        "/api/auth/resend-otp",
        {
          method: "POST",
          body: { registrationId: registration.registrationId, regToken: registration.regToken, channel },
        }
      );
      if (res.email) setMaskedEmail(res.email);
      if (res.phone) setMaskedPhone(res.phone);
      setOtp("");
      startOtpTimer(res.expiresInSeconds);
      showToast(channel === "email" ? "New code sent to your email." : "New code sent to your phone.");
    } catch (err: any) {
      const waitMatch = (err.message || "").match(/wait (\d+)s/);
      if (waitMatch) {
        setResendIn(parseInt(waitMatch[1], 10));
      }
      setAlert({ type: "error", text: err.message || "Could not resend the code." });
    } finally {
      setBusy(false);
    }
  };

  const goBackToDetails = () => {
    setAlert(null);
    setPhase("details");
  };

  const verifyActive = otp.length === 6;

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {phase === "details" ? "Create your account" : phase === "done" ? "Account created" : "Verify your " + (phase === "email" ? "email" : "phone number")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {phase === "details" && "Join NovaCart for a better shopping experience"}
            {phase === "email" && `We sent a 6-digit code to ${maskedEmail || "your email"}`}
            {phase === "phone" && `We sent a 6-digit code to ${maskedPhone || "your phone"}`}
            {phase === "done" && "Your email and phone have been verified."}
          </p>
        </div>

        <StepIndicator phase={phase} />

        <div className="card p-6 sm:p-8">
          {alert && (
            <div className="mb-5">
              <Alert type={alert.type}>{alert.text}</Alert>
            </div>
          )}

          {phase === "details" && (
            <form onSubmit={submitDetails} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email Address *</label>
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
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 86800 60912 (optional)"
                    className="input pl-9"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Optional. You can add and verify your phone later.</p>
              </div>
              <div>
                <label className="label">Password *</label>
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
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create Account"}
              </button>
            </form>
          )}

          {(phase === "email" || phase === "phone") && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                {phase === "email" ? <Mail className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
              </div>

              <div>
                <OtpInput value={otp} onChange={setOtp} disabled={verifying} autoFocus />
                {expireIn > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    Code expires in <span className="font-semibold text-gray-700">{formatClock(expireIn)}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={phase === "email" ? verifyEmail : verifyPhone}
                disabled={!verifyActive || verifying}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {verifying ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Verify"}
              </button>

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">Didn&apos;t receive it?</span>
                {resendIn > 0 ? (
                  <span className="font-semibold text-gray-400">Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resendOtp(phase as "email" | "phone")}
                    disabled={busy}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Resend OTP
                  </button>
                )}
              </div>

              {phase === "email" ? (
                <button
                  type="button"
                  onClick={goBackToDetails}
                  className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Change account details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAlert(null);
                    setPhase("email");
                  }}
                  className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Back to email verification
                </button>
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-5 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Account created successfully!</p>
                <p className="mt-1 text-sm text-gray-500">
                  Your email and phone are verified. Taking you to your dashboard...
                </p>
              </div>
              <div className="mx-auto flex max-w-xs items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2.5 text-xs text-brand-700">
                <ShieldCheck className="h-4 w-4" />
                Your account is protected with secure, encrypted verification.
              </div>
              <button
                type="button"
                onClick={() => router.push(redirect.startsWith("/") ? redirect : "/account")}
                className="btn-primary w-full py-3"
              >
                Go to My Account
              </button>
            </div>
          )}
        </div>

        {phase !== "done" && currentStep < 3 && (
          <p className="mt-5 text-center text-sm text-gray-600">
            {phase === "details" ? (
              <>
                Already have an account?{" "}
                <Link
                  href={`/login${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Log in
                </Link>
              </>
            ) : (
              <>
                <span className="mr-1.5 inline-flex items-center gap-1 align-middle text-xs text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Secure verification — never share your code.
                </span>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                  Log in
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow />
    </Suspense>
  );
}
