"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyOrders } from "@/context/MyOrdersContext";
import type { TrackedOrder } from "@/lib/payments";

const STATUS_STYLES: Record<string, string> = {
  "Pending Confirmation": "bg-gold-light/40 text-gold-dark",
  Confirmed: "bg-forest/10 text-forest-dark",
  Preparing: "bg-blue-100 text-blue-700",
  Cooking: "bg-orange-100 text-orange-700",
  "Ready for Delivery": "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

function OrderCard({ order, contact }: { order: TrackedOrder; contact: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-forest-dark">{order.orderNumber}</p>
          <h2 className="mt-1 font-serif text-lg text-forest-dark">
            {order.packageName}
            {order.menuName ? ` · ${order.menuName}` : ""}
          </h2>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {order.status}
        </span>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">{order.quantityLabel ? "Order" : "Pax"}</dt>
          <dd className="font-medium text-gray-900">{order.quantityLabel ?? order.pax}</dd>
        </div>
        {order.eventDate && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Event</dt>
            <dd className="font-medium text-gray-900">{order.eventDate}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-500">Total</dt>
          <dd className="font-serif text-base text-forest">₱{order.total.toLocaleString()}</dd>
        </div>
      </dl>

      {expanded && (
        <dl className="mt-4 space-y-1.5 border-t border-gold-light/40 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{order.deliveryMethod === "delivery" ? "Delivery Address" : "Method"}</dt>
            <dd className="text-right font-medium text-gray-900 capitalize">
              {order.deliveryMethod === "delivery" ? order.address ?? "—" : "Pickup"}
            </dd>
          </div>
          {order.venue && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Venue</dt>
              <dd className="text-right font-medium text-gray-900">{order.venue}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Payment Status</dt>
            <dd className="font-medium text-gray-900">{order.paymentStatus}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Amount Paid</dt>
            <dd className="font-medium text-gray-900">₱{order.amountPaid.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full border border-forest/40 px-4 py-2 text-sm font-semibold text-forest transition hover:bg-ivory-deep"
        >
          {expanded ? "Hide Details" : "View Order"}
        </button>
        <Link
          href={`/order/track?order=${encodeURIComponent(order.orderNumber)}&contact=${encodeURIComponent(contact)}`}
          className="rounded-full bg-gradient-to-r from-forest to-forest-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Track Order
        </Link>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const { orders, pointers, loading } = useMyOrders();

  function contactFor(orderNumber: string): string {
    return pointers.find((p) => p.orderNumber === orderNumber)?.contact ?? "";
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center">
        <h1 className="font-serif text-3xl italic text-forest-dark">My Orders</h1>
        <p className="mt-3 text-gray-600">You don&apos;t have any orders on this device yet.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Browse the Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <h1 className="font-serif text-3xl italic text-forest-dark">My Orders</h1>
      <p className="mt-1 text-sm text-gray-600">Orders placed from this device.</p>

      {loading && orders.length === 0 && <p className="mt-8 text-center text-sm text-gray-500">Loading your orders…</p>}

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.orderNumber} order={order} contact={contactFor(order.orderNumber)} />
        ))}
      </div>
    </div>
  );
}
