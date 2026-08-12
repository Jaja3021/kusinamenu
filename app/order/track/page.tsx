"use client";

import Link from "next/link";
import { useWizard } from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import { isTrayCartPackage } from "@/lib/packages";

export default function TrackOrderPage() {
  const { lastOrder } = useWizard();
  const { getPackage, resolveMenu, getPaxLabel } = usePackages();

  if (!lastOrder) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center">
        <h1 className="font-serif text-3xl italic text-forest-dark">No orders found</h1>
        <p className="mt-2 text-gray-600">You don&apos;t have a recent order on this device.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Start an order
        </Link>
      </div>
    );
  }

  const pkg = lastOrder.packageSlug ? getPackage(lastOrder.packageSlug) : undefined;
  const menu = lastOrder.packageSlug
    ? resolveMenu(lastOrder.packageSlug, lastOrder.pax, lastOrder.menuId, lastOrder.cart, lastOrder.selectedDishes)
    : undefined;
  const quantityLabel =
    pkg && isTrayCartPackage(pkg)
      ? `${lastOrder.cart.reduce((sum, line) => sum + line.qty, 0)} trays`
      : lastOrder.packageSlug && lastOrder.pax
      ? getPaxLabel(lastOrder.packageSlug, lastOrder.pax)
      : lastOrder.pax;

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <h1 className="font-serif text-3xl italic text-forest-dark">Track Your Order</h1>

      <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06),0_24px_48px_-30px_rgba(27,58,46,0.15)]">
        <div className="flex items-center justify-between">
          <p className="font-mono font-semibold text-forest-dark">{lastOrder.orderNumber}</p>
          <span className="inline-flex items-center rounded-full bg-gold-light/40 px-3 py-1 text-xs font-semibold text-gold-dark">
            {lastOrder.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Placed {new Date(lastOrder.placedAt).toLocaleString()}
        </p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{pkg && isTrayCartPackage(pkg) ? "Order" : "Pax"}</dt>
            <dd className="font-medium text-gray-900">{quantityLabel}</dd>
          </div>
          {pkg && menu && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Package</dt>
              <dd className="font-medium text-gray-900">{pkg.name} · {menu.name}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Event</dt>
            <dd className="text-right font-medium text-gray-900">
              {lastOrder.scheduleInfo.eventType} on {lastOrder.scheduleInfo.date} at {lastOrder.scheduleInfo.time}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Venue</dt>
            <dd className="text-right font-medium text-gray-900">{lastOrder.scheduleInfo.venue}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{lastOrder.deliveryMethod === "delivery" ? "Delivery Address" : "Method"}</dt>
            <dd className="text-right font-medium text-gray-900 capitalize">
              {lastOrder.deliveryMethod === "delivery" ? lastOrder.customerInfo.address : "Pickup"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-1 border-t border-gold-light/40 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>₱{lastOrder.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Fee</span>
            <span>₱{lastOrder.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gold-light/40 pt-2 text-base font-bold">
            <span className="text-forest-dark">Total</span>
            <span className="font-serif text-lg text-forest">₱{lastOrder.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
      >
        Back to Home
      </Link>
    </div>
  );
}
