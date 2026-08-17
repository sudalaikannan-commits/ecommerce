import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Package, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { parseJson } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Confirmed" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderId = searchParams.order;
  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        include: { items: true, shippingMethod: true },
      })
    : null;

  if (!order) redirect("/account/orders");

  const address = parseJson<Record<string, string>>(order.addressSnapshot, {});

  return (
    <div className="container-x max-w-3xl py-12">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you for your purchase, {user.name.split(" ")[0]}. Your order has been placed
          successfully.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">
          <Receipt className="h-4 w-4 text-brand-600" /> Order #{order.orderNumber}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          A confirmation email with your order details has been sent to {user.email}.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order Status</p>
          <p className="mt-1 font-semibold capitalize text-gray-900">
            {order.orderStatus.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</p>
          <p className="mt-1 font-semibold text-gray-900">
            {order.paymentStatus === "PAID" ? "Paid" : "Pending"} ·{" "}
            {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Paid</p>
          <p className="mt-1 text-lg font-bold text-brand-600">{formatPrice(order.total)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Package className="h-4 w-4 text-brand-600" /> Delivery Address
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{address.fullName}</p>
            <p>{address.line1}</p>
            {address.line2 && <p>{address.line2}</p>}
            <p>{address.city}, {address.state} - {address.postalCode}</p>
            <p>{address.country}</p>
            <p>{address.phone}</p>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Items</h3>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {item.productName}
                  {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">Shipping ({order.shippingMethod?.name ?? "Standard"})</span>
            <span className="font-medium">{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className="btn-primary">View My Orders</Link>
        <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}