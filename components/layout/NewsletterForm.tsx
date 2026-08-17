"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";

export function NewsletterForm() {
  const { showToast } = useShop();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/api/newsletter", {
        method: "POST",
        body: { email },
      });
      showToast(res.message);
      setEmail("");
    } catch (err: any) {
      showToast(err.message || "Could not subscribe.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
      >
        Subscribe
      </button>
    </form>
  );
}