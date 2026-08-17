"use client";

import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { useShop } from "../providers/ShopProvider";

export function Toaster() {
  const { toasts, dismissToast } = useShop();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border bg-white p-4 shadow-pop"
          role="status"
        >
          {toast.type === "success" && (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          )}
          {toast.type === "error" && (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          )}
          {toast.type === "info" && (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          )}
          <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}