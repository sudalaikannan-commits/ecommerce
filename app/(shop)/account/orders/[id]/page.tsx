"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Package, Receipt, Truck } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { PageLoader } from "@/components/ui";

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
  createdAt: string;
  addressSnapshot: Record<string, string>;
  shippingMethod: { id: string; name: string } | null;
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
  payments: { id: string; gateway: string; status: string; amount: number }[];
}

const statusColor = (s: string) =>
  ({ PENDING: "bg-amber-100 text-amber-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-violet-100 text-violet-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" })[s] || "bg-gray-100 text-gray-700";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api<{ order: Order }>(`/api/account/orders/${id}`);
        setOrder(res.order);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!order) {
    return (
      <div>
        <p className="mb-4 text-sm text-gray-500">Order not found.</p>
        <Link href="/account/orders" className="btn-secondary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/account/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Package className="h-5 w-5 text-brand-600" /> Order #{order.orderNumber}
          </h2>
          <div className="flex gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(order.orderStatus)}`}>
              {order.orderStatus}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {order.paymentStatus === "PAID" ? "Paid" : "Payment Pending"}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery Address</p>
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{order.addressSnapshot.fullName}</p>
            <p>{order.addressSnapshot.line1}</p>
            {order.addressSnapshot.line2 && <p>{order.addressSnapshot.line2}</p>}
            <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.postalCode}</p>
            <p>{order.addressSnapshot.phone}</p>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shipping</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4 text-brand-600" />
            {order.shippingMethod?.name || "Standard"}
          </div>
          <p className="mt-2 text-xs text-gray-500">Estimated delivery updates will be sent to your email.</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Receipt className="h-4 w-4 text-brand-600" />
            {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
          </div>
          {order.notes && <p className="mt-2 text-xs text-gray-500">Note: {order.notes}</p>}
        </div>
      </div>

      <div className="card p-5">
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
                <p className="text-xs text-gray-500">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span><span>{formatPrice(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Payment History</h3>
          <div className="space-y-2 text-sm">
            {order.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{p.gateway}</p>
                  <p className="text-xs text-gray-500">Ref: {p.id.slice(0, 12)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatPrice(p.amount)}</p>
                  <p className={`text-xs font-medium ${p.status === "SUCCESS" ? "text-green-600" : "text-amber-600"}`}>{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/shop" className="btn-primary">Shop More</Link>
        <Link href="/account/orders" className="btn-secondary">All Orders</Link>
      </div>
    </div>
  );
}