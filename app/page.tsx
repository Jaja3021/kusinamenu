"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { BackButton } from "@/components/BackButton";
import { OrderBadge } from "@/components/OrderBadge";
import { useWizard } from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import { EVENT_TYPES, type EventTypeInfo } from "@/lib/events";
import {
  getPriceRange,
  getPaxSizeLabels,
  getMinimumPax,
  getRatePerHead,
  isTrayCartPackage,
  getTrayPriceRange,
  isPackedMealPackage,
  getPackedMealPriceRange,
  isHeadCountPackage,
} from "@/lib/packages";

type PackageIcon = (props: { className?: string }) => React.ReactNode;

// Icons live here (not in lib/events.ts) so the event catalog stays plain
// data, reusable from Server Actions/dashboard code without pulling in JSX.
const EVENT_ICONS: Record<string, PackageIcon> = {
  wedding: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="9" cy="14" r="5" />
      <circle cx="15" cy="14" r="5" />
    </svg>
  ),
  "kids-party": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5.5l5.5 12.5H6.5L12 5.5z" />
      <circle cx="12" cy="4.3" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6.5 18h11" />
    </svg>
  ),
  debut: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 17h16l-1.5-7-3.5 3-3-5-3 5-3.5-3L4 17z" />
      <path d="M4 20h16" />
    </svg>
  ),
  corporate: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="11" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  ),
  private: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <path d="M12 17c-2-1.5-3.2-2.6-3.2-4a1.8 1.8 0 0 1 3.2-1.1A1.8 1.8 0 0 1 15.2 13c0 1.4-1.2 2.5-3.2 4z" fill="currentColor" stroke="none" />
    </svg>
  ),
  "tray-orders": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="10" width="16" height="3" rx="1" />
      <path d="M6 13v7h12v-7" />
      <path d="M12 10V6" />
      <path d="M12 6a2 2 0 1 1 2-2 3 3 0 0 1-2 2z" />
      <path d="M12 6a2 2 0 1 0-2-2 3 3 0 0 0 2 2z" />
    </svg>
  ),
};

const PACKAGE_ICONS: Record<string, PackageIcon> = {
  "party-trays": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="10" width="16" height="3" rx="1" />
      <path d="M6 13v7h12v-7" />
      <path d="M12 10V6" />
      <path d="M12 6a2 2 0 1 1 2-2 3 3 0 0 1-2 2z" />
      <path d="M12 6a2 2 0 1 0-2-2 3 3 0 0 0 2 2z" />
    </svg>
  ),
  "packed-meals": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="8" width="16" height="12" rx="1.5" />
      <path d="M4 12h16" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  "grazing-table": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  ),
  "grazing-board": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </svg>
  ),
  "basic-catering": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20L20 4" />
      <path d="M20 4l-5 1.2" />
      <path d="M20 4l-1.2 5" />
    </svg>
  ),
  "classic-catering": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3z" />
    </svg>
  ),
};

// Fallback for any package slug not in PACKAGE_ICONS above — e.g. a brand
// new package created from the dashboard. Without this, an unknown slug
// looked up a few lines below crashes the whole landing page (React throws
// "Element type is invalid" trying to render `<undefined />`), which is
// exactly what used to happen: this map is admin-curated and package
// creation in herbies-dashboard's /dashboard/menu has no reason to know
// about it.
const DefaultPackageIcon: PackageIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 12h8M12 8v8" />
  </svg>
);

export default function PackageSelectionPage() {
  const router = useRouter();
  const { setPackage, setEventType } = useWizard();
  const { packages, loading } = usePackages();
  const [selectedEvent, setSelectedEvent] = useState<EventTypeInfo | null>(null);

  function handleSelect(slug: string) {
    setPackage(slug);
    router.push("/order/build");
  }

  function handlePickEvent(event: EventTypeInfo) {
    setSelectedEvent(event);
    setEventType(event.slug);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-12 pt-8">
      {selectedEvent && <Stepper current={1} />}

      <div
        className={`relative rounded-3xl bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(27,58,46,0.04),0_24px_48px_-24px_rgba(27,58,46,0.12)] ${
          selectedEvent ? "mt-8" : ""
        }`}
      >
        <OrderBadge className="absolute right-6 top-6" />

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
          Kusinang Pamana Catering
        </p>
        <h1 className="mt-3 font-serif text-4xl italic text-forest-dark">
          {selectedEvent ? selectedEvent.name : "What are you celebrating?"}
        </h1>
        <p className="mt-3 text-gray-600">
          {selectedEvent
            ? "Choose a catering package for your event."
            : "Tray orders, grazing spreads, and full-service catering — all priced upfront."}
        </p>

        {!selectedEvent && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_TYPES.map((event) => (
              <button
                key={event.slug}
                type="button"
                onClick={() => handlePickEvent(event)}
                className="group flex flex-col items-center rounded-3xl border border-gold-light/40 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_36px_-18px_rgba(27,58,46,0.25)]"
              >
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ivory text-forest shadow-[0_4px_14px_rgba(27,58,46,0.08)] ring-1 ring-gold-light transition-transform duration-300 group-hover:scale-105">
                  {(() => {
                    const Icon = EVENT_ICONS[event.slug];
                    return Icon ? <Icon className="h-10 w-10" /> : null;
                  })()}
                </span>
                <h3 className="mt-5 font-serif text-lg text-forest-dark">
                  {event.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {event.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="mt-4">
          <BackButton onClick={() => setSelectedEvent(null)} label="Choose a different event" />
        </div>
      )}

      {selectedEvent && loading && (
        <p className="mt-10 text-center text-sm text-gray-500">Loading packages…</p>
      )}

      {selectedEvent && !loading && selectedEvent.categories.map((category) => {
        const items = packages.filter((p) => p.category === category && p.active);
        return (
          <div key={category} className="mt-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-gold" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {category}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {items.map((pkg) => {
                const isCart = isTrayCartPackage(pkg);
                const isPackedMeal = isPackedMealPackage(pkg);
                const isHeadCount = isHeadCountPackage(pkg);
                const min = isCart
                  ? getTrayPriceRange(pkg).min
                  : isPackedMeal
                  ? getPackedMealPriceRange(pkg).min
                  : !isHeadCount
                  ? getPriceRange(pkg).min
                  : 0;
                const Icon = PACKAGE_ICONS[pkg.slug] ?? DefaultPackageIcon;
                return (
                  <button
                    key={pkg.slug}
                    type="button"
                    onClick={() => handleSelect(pkg.slug)}
                    className={`group relative flex flex-col items-start rounded-2xl border bg-white p-6 text-left shadow-[0_1px_3px_rgba(27,58,46,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(27,58,46,0.3)] ${
                      pkg.recommended
                        ? "border-gold-light bg-gradient-to-b from-ivory-deep/70 to-white ring-1 ring-gold-light/70"
                        : "border-gold-light/30 hover:border-forest"
                    }`}
                  >
                    {pkg.recommended && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-gold-dark px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
                        ★ Recommended
                      </span>
                    )}
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm ${
                        pkg.recommended
                          ? "bg-gradient-to-br from-gold to-gold-dark"
                          : "bg-forest"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 font-serif text-xl text-forest-dark">{pkg.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>

                    <div className="mt-4 w-full space-y-2 border-t border-gold-light/40 pt-3 text-sm">
                      {isCart ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Style</span>
                            <span className="font-medium text-gray-700">À la carte</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">From</span>
                            <span className="font-serif text-base text-forest">₱{min.toLocaleString()}</span>
                          </div>
                        </>
                      ) : isPackedMeal ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Style</span>
                            <span className="font-medium text-gray-700">Per piece</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">From</span>
                            <span className="font-serif text-base text-forest">₱{min.toLocaleString()}/pc</span>
                          </div>
                        </>
                      ) : isHeadCount ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Rate</span>
                            <span className="font-serif text-base text-forest">
                              ₱{getRatePerHead(pkg).toLocaleString()} / head
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Minimum</span>
                            <span className="font-medium text-gray-700">{getMinimumPax(pkg)} pax</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sizes</span>
                            <span className="font-medium text-gray-700">{getPaxSizeLabels(pkg).join(" · ")} pax</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">From</span>
                            <span className="font-serif text-base text-forest">₱{min.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <span className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:shadow-md">
                      Select Package
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
