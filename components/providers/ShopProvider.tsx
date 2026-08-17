"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/client";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ShopContextValue {
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  cartCount: number;
  refreshCartCount: () => Promise<void>;
  wishlistCount: number;
  refreshWishlistCount: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await api<{ user: User | null }>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const refreshCartCount = useCallback(async () => {
    try {
      const res = await api<{ totals: { itemCount: number } }>("/api/cart");
      setCartCount(res.totals?.itemCount ?? 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  const refreshWishlistCount = useCallback(async () => {
    try {
      const res = await api<{ items: unknown[] }>("/api/account/wishlist");
      setWishlistCount(res.items.length);
    } catch {
      setWishlistCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (ready) {
      refreshCartCount();
      refreshWishlistCount();
    }
  }, [ready, refreshCartCount, refreshWishlistCount]);

  const value = useMemo(
    () => ({
      user,
      ready,
      setUser,
      refreshUser,
      cartCount,
      refreshCartCount,
      wishlistCount,
      refreshWishlistCount,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      user,
      ready,
      setUser,
      refreshUser,
      cartCount,
      refreshCartCount,
      wishlistCount,
      refreshWishlistCount,
      toasts,
      showToast,
      dismissToast,
    ]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}