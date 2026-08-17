"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader } from "@/components/ui";
import { StatusBadge } from "@/components/admin/ui";

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  addressSnapshot: Record<string, string>;
  user: { id: string; name: string; email: string; phone: string | null };
  shippingMethod: { id: string; name: string } | null;
  coupon: { code: string } | null;
  items: {
    id: string;
    productName: string;
    productSlug: string;
    image: string | null;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  payments: { id: string; gateway: string; status: string; amount: number; createdAt: string }[];
}

const orderStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useShop();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api<{ order: Order }>(`/api/admin/orders/${id}`);
        setOrder(res.order);
        setStatus(res.order.orderStatus);
        setPaymentStatus(res.order.paymentStatus);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!order) return <p className="text-gray-500">Order not found.</p>;

  const saveStatus = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        body: { orderStatus: status, paymentStatus, notes: notes || null },
      });
      showToast("Order updated");
      setOrder((prev) => prev ? { ...prev, orderStatus: status, paymentStatus, notes: notes || prev.notes } : prev);
    } catch (err: any) {
      showToast(err.message || "Could not update order", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Link href={`/product/${item.productSlug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image && <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="64px" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${item.productSlug}`} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-brand-600">
                      {item.productName}
                    </Link>
                    {item.variantLabel && <p className="text-xs text-gray-500">{item.variantLabel}</p>}
                    <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount {order.coupon && `(${order.coupon.code})`}</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span></div>
              {order.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Payments</h3>
              <div className="space-y-2">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.gateway}</p>
                      <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(p.amount)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Customer</h3>
            <p className="font-medium text-gray-900">{order.user.name}</p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
            {order.user.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
            <Link href="/admin/customers" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">View all customers</Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Delivery Address</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.addressSnapshot.fullName}</p>
              <p>{order.addressSnapshot.line1}</p>
              {order.addressSnapshot.line2 && <p>{order.addressSnapshot.line2}</p>}
              <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.postalCode}</p>
              <p>{order.addressSnapshot.country} · {order.addressSnapshot.phone}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Update Order</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Order Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                  {orderStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input">
                  {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Admin Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[70px]" placeholder="e.g. reason for cancellation, courier details..." />
              </div>
              <button onClick={saveStatus} disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
              {order.cancelReason && (
                <p className="rounded-lg bg-red-50 p-3 text-xs text-red-600">Cancel reason: {order.cancelReason}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}