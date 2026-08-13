"use client";

import Link from "next/link";
import { useWizard } from "@/context/WizardContext";

// Renders only once a customer has an order on this device/browser. No
// hydration guard needed beyond checking lastOrder: it initializes to null
// and is only populated inside WizardProvider's post-mount useEffect, so
// the server render and the first client render already agree (both
// render nothing) — there's no mismatch to have.
export function TrackOrderBanner() {
  const { lastOrder } = useWizard();
  if (!lastOrder) return null;

  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:flex-row">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ivory text-forest ring-1 ring-gold-light">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect x="5" y="3" width="10" height="14" rx="1.5" />
            <path d="M8 7h4M8 10h4" />
            <circle cx="16.5" cy="16.5" r="3.5" />
            <path d="M19.5 19.5L21.5 21.5" />
          </svg>
        </span>
        <div>
          <h2 className="font-serif text-lg text-forest-dark">Already have an order?</h2>
          <p className="text-sm text-gray-600">Track your order status, payment, and delivery in real time.</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col items-center gap-1 sm:items-end">
        <Link
          href={`/order/track?order=${encodeURIComponent(lastOrder.orderNumber)}`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          🔍 Track My Order
        </Link>
        <p className="text-xs text-gray-500">Enter your order number and email or mobile number to get started.</p>
      </div>
    </div>
  );
}
