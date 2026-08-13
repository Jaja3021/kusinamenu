"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMyOrders } from "@/context/MyOrdersContext";

// The only persistent chrome on the storefront side (there was none before
// — see app/layout.tsx). Kept to exactly two links per the "keep it simple"
// requirement: Menu and My Orders. The badge count is never hardcoded —
// it's MyOrdersContext's activeCount, derived from live database orders.
//
// Rendered from the ROOT layout (so it's available on every route without
// per-page wiring), which also means /dashboard/* renders underneath it —
// that section already has its own header (app/dashboard/layout.tsx), so
// this one self-hides there rather than stacking two navs.
export function ClientNav() {
  const pathname = usePathname();
  const { activeCount } = useMyOrders();

  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <header className="border-b border-gold-light/40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl italic text-forest-dark">
          Kusinang Pamana
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-forest-dark">
            Menu
          </Link>
          <Link href="/order/mine" className="flex items-center gap-1.5 hover:text-forest-dark">
            My Orders
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
