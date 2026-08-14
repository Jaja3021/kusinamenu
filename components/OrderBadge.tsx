"use client";

import Link from "next/link";
import { useMyOrders } from "@/context/MyOrdersContext";

// The single storefront entry point back to an order, replacing the old
// full-width nav bar (components/ClientNav.tsx, now removed) with a small
// icon in the corner of the "What are you celebrating?" card — see
// app/page.tsx. Self-hides until the device has placed at least one order:
// a first-time visitor has nowhere useful for this to go.
//
// `className` positions the whole badge within its parent (e.g.
// "absolute right-6 top-6"); the inner Link is separately `relative` so the
// count bubble always anchors to the icon itself regardless of how the
// outer wrapper is positioned.
export function OrderBadge({ className = "" }: { className?: string }) {
  const { pointers, activeCount } = useMyOrders();

  if (pointers.length === 0) return null;

  return (
    <span className={className}>
      <Link
        href="/order/mine"
        aria-label={activeCount > 0 ? `My Orders (${activeCount} active)` : "My Orders"}
        className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-light/50 bg-ivory-deep/60 text-forest-dark shadow-sm transition hover:border-gold hover:bg-ivory-deep"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M6 8V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2" />
          <path d="M4.5 8h15l-1 12a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5L4.5 8z" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
      </Link>
    </span>
  );
}
