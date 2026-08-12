"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { BackButton } from "@/components/BackButton";
import { useWizard } from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import { isTrayCartPackage, isPackedMealPackage } from "@/lib/packages";

export default function ReviewQuotePage() {
  const router = useRouter();
  const { draft, subtotal } = useWizard();
  const { getPackage, resolveMenu, getPaxLabel, loading } = usePackages();
  const pkg = draft.packageSlug ? getPackage(draft.packageSlug) : undefined;
  const menu = draft.packageSlug
    ? resolveMenu(draft.packageSlug, draft.pax, draft.menuId, draft.cart, draft.selectedDishes, draft.packedMealCart)
    : undefined;

  useEffect(() => {
    if (loading) return;
    if (!pkg || !menu) router.replace("/");
  }, [pkg, menu, loading, router]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center text-gray-500">Loading…</div>;
  }

  if (!pkg || !menu) return null;

  const isCart = isTrayCartPackage(pkg);
  const isPackedMeal = isPackedMealPackage(pkg);
  const quantityLabel = isCart
    ? `${draft.cart.reduce((sum, line) => sum + line.qty, 0)} tray${
        draft.cart.reduce((sum, line) => sum + line.qty, 0) === 1 ? "" : "s"
      }`
    : isPackedMeal
    ? `${draft.packedMealCart.reduce((sum, line) => sum + line.qty, 0)} pcs`
    : `${getPaxLabel(pkg.slug, draft.pax ?? 0)} Pax`;

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <Stepper current={3} />

      <h1 className="mt-8 font-serif text-3xl italic text-forest-dark">Review your quote</h1>
      <p className="mt-1 text-gray-600">Double-check your selection before confirming details.</p>

      <div className="mt-4">
        <BackButton onClick={() => router.push("/order/build")} label="Edit selection" />
      </div>

      <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06),0_24px_48px_-30px_rgba(27,58,46,0.15)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {pkg.category}
            </p>
            <h2 className="font-serif text-xl text-forest-dark">{pkg.name}</h2>
          </div>
          <p className="text-sm font-medium text-gray-600">{quantityLabel}</p>
        </div>

        <div className="mt-4 border-t border-gold-light/40 pt-4">
          <p className="text-sm font-semibold text-forest">{menu.name}</p>
          <div className="mt-2 space-y-3 text-sm text-gray-600">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {isCart ? "Trays Ordered" : isPackedMeal ? "Meals Ordered" : "Mains"}
              </p>
              <ul className="mt-1 space-y-1">
                {menu.mains.map((dish) => (
                  <li key={dish}>• {dish}</li>
                ))}
              </ul>
            </div>
            {menu.sides.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sides</p>
                <ul className="mt-1 space-y-1">
                  {menu.sides.map((dish) => (
                    <li key={dish}>• {dish}</li>
                  ))}
                </ul>
              </div>
            )}
            {menu.snacks.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Snacks</p>
                <ul className="mt-1 space-y-1">
                  {menu.snacks.map((dish) => (
                    <li key={dish}>• {dish}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-gold-light/40 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Add-ons Available</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {pkg.addOns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            Optional — not included in the total below. Arrange these directly with our team.
          </p>
        </div>

        <div className="mt-6 space-y-1 border-t border-gold-light/40 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-serif text-base text-forest-dark">₱{subtotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400">Delivery fee (if applicable) is added at checkout.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/order/confirm")}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md sm:w-auto"
      >
        Continue to Confirm
      </button>
    </div>
  );
}
