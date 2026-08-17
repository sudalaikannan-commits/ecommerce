"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/money";
import { EmptyState, PageLoader } from "@/components/ui";

interface OrderLite {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: string; productName: string; productSlug: string; image: string | null; quantity: number }[];
}

const statusColor = (s: string) =>
  ({ PENDING: "bg-amber-100 text-amber-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-violet-100 text-violet-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" })[s] || "bg-gray-100 text-gray-700";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ orders: OrderLite[] }>("/api/account/orders?perPage=50");
        setOrders(res.orders);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order, it will appear here."
        action={<Link href="/shop" className="btn-primary">Start Shopping</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Package className="h-5 w-5 text-brand-600" /> My Orders ({orders.length})
        </h2>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="card flex flex-col gap-4 p-5 transition hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {order.items[0]?.image && (
                  <Image src={order.items[0].image} alt={order.items[0].productName} fill className="object-cover" sizes="64px" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-500">{order.items.length} item(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
              <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}