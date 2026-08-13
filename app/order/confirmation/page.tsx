"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWizard } from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import { isTrayCartPackage } from "@/lib/packages";

export default function ConfirmationPage() {
  const router = useRouter();
  const { lastOrder, resetDraft } = useWizard();
  const { getPackage, resolveMenu, getPaxLabel } = usePackages();

  if (!lastOrder) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
        <h1 className="font-serif text-3xl italic text-forest-dark">No recent order</h1>
        <p className="mt-4 text-gray-600">Place an order to see a confirmation here.</p>
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
    ? resolveMenu(
        lastOrder.packageSlug,
        lastOrder.pax,
        lastOrder.menuId,
        lastOrder.cart,
        lastOrder.selectedDishes,
        lastOrder.packedMealCart
      )
    : undefined;
  const quantityLabel =
    pkg && isTrayCartPackage(pkg)
      ? `${lastOrder.cart.reduce((sum, line) => sum + line.qty, 0)} trays`
      : `${getPaxLabel(pkg?.slug ?? "", lastOrder.pax ?? 0)} Pax`;

  function handleBackToHome() {
    resetDraft();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <h1 className="text-center font-serif text-4xl italic text-forest-dark">🎉 Thank You!</h1>

      <div className="mt-8 rounded-2xl border border-gold-light/40 bg-white p-8 text-center shadow-[0_1px_3px_rgba(27,58,46,0.06),0_24px_48px_-30px_rgba(27,58,46,0.15)]">
        <p className="text-gray-600">Your order has been successfully placed.</p>
        <p className="mt-4">
          Order Number{" "}
          <span className="font-mono font-semibold text-forest-dark">{lastOrder.orderNumber}</span>
        </p>
        <p className="mt-1 text-sm">
          <span className="inline-flex items-center rounded-full bg-gold-light/40 px-3 py-1 text-xs font-semibold text-gold-dark">
            {lastOrder.status}
          </span>
        </p>

        {pkg && menu && (
          <dl className="mt-6 space-y-2 border-t border-gold-light/40 pt-6 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Package</dt>
              <dd className="font-medium text-gray-900">
                {pkg.name} ({quantityLabel})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Menu</dt>
              <dd className="font-medium text-gray-900">{menu.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Event</dt>
              <dd className="font-medium text-gray-900">
                {lastOrder.scheduleInfo.eventType} · {lastOrder.scheduleInfo.date}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gold-light/40 pt-2 text-base font-bold">
              <dt className="text-forest-dark">Total</dt>
              <dd className="font-serif text-lg text-forest">₱{lastOrder.total.toLocaleString()}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/order/track?order=${encodeURIComponent(lastOrder.orderNumber)}`}
          className="rounded-full border border-forest/40 px-5 py-3 text-sm font-semibold text-forest transition hover:bg-ivory-deep"
        >
          Track Order
        </Link>
        <button
          type="button"
          onClick={handleBackToHome}
          className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
