import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackagesData } from "@/lib/packages-data";
import {
  isTrayCartPackage,
  isPackedMealPackage,
  isHeadCountPackage,
  packageCategories,
  TRAY_CATEGORIES,
  PACKED_MEAL_CATEGORIES,
} from "@/lib/packages";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import {
  updatePackageDetailsAction,
  deletePackageAction,
  savePaxTierAction,
  deletePaxTierAction,
  saveTrayDishAction,
  deleteTrayDishAction,
  savePackedMealCategoryAction,
  deletePackedMealCategoryAction,
} from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const smallInputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const cardClass = "rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]";
const dangerButtonClass = "text-xs font-semibold text-red-600 hover:underline";
const addButtonClass =
  "rounded-full bg-gradient-to-r from-forest to-forest-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md";

export default async function EditPackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const packages = await getPackagesData();
  const pkg = packages.find((p) => p.slug === slug);
  if (!pkg) notFound();

  const isTray = isTrayCartPackage(pkg);
  const isPacked = isPackedMealPackage(pkg);
  const isHeadCount = isHeadCountPackage(pkg);
  const showTiers = !isTray && !isPacked && !isHeadCount;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/menu" className="text-sm font-medium text-forest hover:underline">
          ← Back to Menu
        </Link>
        <form action={deletePackageAction}>
          <input type="hidden" name="slug" value={pkg.slug} />
          <ConfirmSubmitButton
            confirmMessage={`Delete "${pkg.name}"? This removes it from the storefront immediately and cannot be undone.`}
            className={dangerButtonClass}
          >
            Delete Package
          </ConfirmSubmitButton>
        </form>
      </div>

      <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{pkg.slug}</p>

      <form action={updatePackageDetailsAction} className={`mt-6 space-y-4 ${cardClass}`}>
        <input type="hidden" name="slug" value={pkg.slug} />
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Package Details</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Name *
            <input name="name" required defaultValue={pkg.name} className={inputClass} />
          </label>
          <label className="text-sm">
            Category *
            <select name="category" required defaultValue={pkg.category} className={inputClass}>
              {packageCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          Description *
          <textarea name="description" required rows={2} defaultValue={pkg.description} className={inputClass} />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="recommended" defaultChecked={pkg.recommended} className="h-4 w-4 accent-forest" />
          Mark as Recommended
        </label>

        {isHeadCount && (
          <div className="grid grid-cols-1 gap-4 border-t border-gold-light/40 pt-4 sm:grid-cols-2">
            <label className="text-sm">
              Price per head (₱) *
              <input type="number" name="pricePerHead" required min={0} defaultValue={pkg.pricePerHead} className={inputClass} />
            </label>
            <label className="text-sm">
              Minimum head count *
              <input type="number" name="minimumHeadCount" required min={1} defaultValue={pkg.minimumHeadCount} className={inputClass} />
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-gold-light/40 pt-4 sm:grid-cols-2">
          <label className="text-sm">
            Inclusions <span className="text-xs font-normal text-gray-400">(one per line)</span>
            <textarea name="inclusions" rows={4} defaultValue={pkg.inclusions.join("\n")} className={inputClass} />
          </label>
          <label className="text-sm">
            Add-ons <span className="text-xs font-normal text-gray-400">(one per line)</span>
            <textarea name="addOns" rows={4} defaultValue={pkg.addOns.join("\n")} className={inputClass} />
          </label>
        </div>

        <button type="submit" className={addButtonClass}>
          Save Details
        </button>
      </form>

      {showTiers && (
        <div className={`mt-6 ${cardClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Pax Tiers</p>
          {pkg.paxTiers.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">No pax tiers yet — add one below.</p>
          )}
          <ul className="mt-3 divide-y divide-gold-light/30">
            {pkg.paxTiers
              .slice()
              .sort((a, b) => a.pax - b.pax)
              .map((tier) => (
                <li key={tier.pax} className="py-3">
                  <form action={savePaxTierAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="packageSlug" value={pkg.slug} />
                    <label className="text-xs text-gray-500">
                      Pax
                      <input type="number" name="pax" required min={1} defaultValue={tier.pax} className={`${smallInputClass} w-20`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      Label <span className="text-gray-400">(optional)</span>
                      <input name="paxLabel" defaultValue={tier.paxLabel} className={`${smallInputClass} w-28`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      Menu name
                      <input name="menuName" defaultValue={tier.menus[0]?.name ?? "Full Spread"} className={`${smallInputClass} w-32`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      Price (₱)
                      <input type="number" name="price" required min={0} defaultValue={tier.menus[0]?.price} className={`${smallInputClass} w-28`} />
                    </label>
                    <button type="submit" className="rounded-full border border-forest/40 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-ivory-deep">
                      Save
                    </button>
                  </form>
                  <form action={deletePaxTierAction} className="mt-1">
                    <input type="hidden" name="packageSlug" value={pkg.slug} />
                    <input type="hidden" name="pax" value={tier.pax} />
                    <ConfirmSubmitButton confirmMessage={`Remove the ${tier.pax}-pax tier?`} className={dangerButtonClass}>
                      Remove tier
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
          </ul>

          <form action={savePaxTierAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-gold-light/40 pt-4">
            <input type="hidden" name="packageSlug" value={pkg.slug} />
            <label className="text-xs text-gray-500">
              Pax
              <input type="number" name="pax" required min={1} className={`${smallInputClass} w-20`} />
            </label>
            <label className="text-xs text-gray-500">
              Label <span className="text-gray-400">(optional)</span>
              <input name="paxLabel" placeholder="e.g. 15-25" className={`${smallInputClass} w-28`} />
            </label>
            <label className="text-xs text-gray-500">
              Menu name
              <input name="menuName" placeholder="Full Spread" className={`${smallInputClass} w-32`} />
            </label>
            <label className="text-xs text-gray-500">
              Price (₱)
              <input type="number" name="price" required min={0} className={`${smallInputClass} w-28`} />
            </label>
            <button type="submit" className={addButtonClass}>
              + Add Tier
            </button>
          </form>
        </div>
      )}

      {isTray && (
        <div className={`mt-6 ${cardClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Tray Dishes</p>
          <ul className="mt-3 divide-y divide-gold-light/30">
            {(pkg.trayCatalog ?? []).map((dish) => (
              <li key={dish.id} className="py-3">
                <form action={saveTrayDishAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="packageSlug" value={pkg.slug} />
                  <input type="hidden" name="dishId" value={dish.id} />
                  <label className="text-xs text-gray-500">
                    Name
                    <input name="name" required defaultValue={dish.name} className={`${smallInputClass} w-40`} />
                  </label>
                  <label className="text-xs text-gray-500">
                    Category
                    <select name="category" defaultValue={dish.category} className={`${smallInputClass} w-32`}>
                      {TRAY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-gray-500">
                    Family (₱)
                    <input type="number" name="priceFamily" min={0} defaultValue={dish.prices.Family} className={`${smallInputClass} w-24`} />
                  </label>
                  <label className="text-xs text-gray-500">
                    Feast (₱)
                    <input type="number" name="priceFeast" min={0} defaultValue={dish.prices.Feast} className={`${smallInputClass} w-24`} />
                  </label>
                  <label className="text-xs text-gray-500">
                    XXXL (₱)
                    <input type="number" name="priceXXXL" min={0} defaultValue={dish.prices.XXXL} className={`${smallInputClass} w-24`} />
                  </label>
                  <button type="submit" className="rounded-full border border-forest/40 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-ivory-deep">
                    Save
                  </button>
                </form>
                <form action={deleteTrayDishAction} className="mt-1">
                  <input type="hidden" name="packageSlug" value={pkg.slug} />
                  <input type="hidden" name="dishId" value={dish.id} />
                  <ConfirmSubmitButton confirmMessage={`Remove "${dish.name}"?`} className={dangerButtonClass}>
                    Remove dish
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>

          <form action={saveTrayDishAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-gold-light/40 pt-4">
            <input type="hidden" name="packageSlug" value={pkg.slug} />
            <label className="text-xs text-gray-500">
              Name
              <input name="name" required placeholder="e.g. Beef Kare-Kare" className={`${smallInputClass} w-40`} />
            </label>
            <label className="text-xs text-gray-500">
              Category
              <select name="category" className={`${smallInputClass} w-32`}>
                {TRAY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500">
              Family (₱)
              <input type="number" name="priceFamily" min={0} className={`${smallInputClass} w-24`} />
            </label>
            <label className="text-xs text-gray-500">
              Feast (₱)
              <input type="number" name="priceFeast" min={0} className={`${smallInputClass} w-24`} />
            </label>
            <label className="text-xs text-gray-500">
              XXXL (₱)
              <input type="number" name="priceXXXL" min={0} className={`${smallInputClass} w-24`} />
            </label>
            <button type="submit" className={addButtonClass}>
              + Add Dish
            </button>
          </form>
        </div>
      )}

      {isPacked && (
        <div className={`mt-6 ${cardClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Packed Meal Categories</p>
          <ul className="mt-3 space-y-4 divide-y divide-gold-light/30">
            {(pkg.packedMealCatalog ?? []).map((cat) => (
              <li key={cat.category} className="pt-4 first:pt-0">
                <form action={savePackedMealCategoryAction} className="space-y-2">
                  <input type="hidden" name="packageSlug" value={pkg.slug} />
                  <input type="hidden" name="category" value={cat.category} />
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="text-sm font-semibold text-gray-900">{cat.category}</p>
                    <label className="text-xs text-gray-500">
                      Tag <span className="text-gray-400">(optional)</span>
                      <input name="tag" defaultValue={cat.tag} className={`${smallInputClass} w-32`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      25+ pcs (₱/pc)
                      <input type="number" name="price25" min={0} defaultValue={cat.tiers[0]?.pricePerPc} className={`${smallInputClass} w-24`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      50+ pcs (₱/pc)
                      <input type="number" name="price50" min={0} defaultValue={cat.tiers[1]?.pricePerPc} className={`${smallInputClass} w-24`} />
                    </label>
                    <label className="text-xs text-gray-500">
                      100+ pcs (₱/pc)
                      <input type="number" name="price100" min={0} defaultValue={cat.tiers[2]?.pricePerPc} className={`${smallInputClass} w-24`} />
                    </label>
                  </div>
                  <label className="block text-xs text-gray-500">
                    Description
                    <input name="description" defaultValue={cat.description} className={smallInputClass} />
                  </label>
                  <label className="block text-xs text-gray-500">
                    Dishes <span className="text-gray-400">(one per line)</span>
                    <textarea name="dishes" rows={3} defaultValue={cat.dishes.join("\n")} className={smallInputClass} />
                  </label>
                  <button type="submit" className="rounded-full border border-forest/40 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-ivory-deep">
                    Save
                  </button>
                </form>
                <form action={deletePackedMealCategoryAction} className="mt-1">
                  <input type="hidden" name="packageSlug" value={pkg.slug} />
                  <input type="hidden" name="category" value={cat.category} />
                  <ConfirmSubmitButton confirmMessage={`Remove the "${cat.category}" category?`} className={dangerButtonClass}>
                    Remove category
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>

          <form action={savePackedMealCategoryAction} className="mt-4 space-y-2 border-t border-gold-light/40 pt-4">
            <input type="hidden" name="packageSlug" value={pkg.slug} />
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-gray-500">
                Category
                <select name="category" className={`${smallInputClass} w-40`}>
                  {PACKED_MEAL_CATEGORIES.filter(
                    (c) => !(pkg.packedMealCatalog ?? []).some((existing) => existing.category === c)
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-500">
                Tag <span className="text-gray-400">(optional)</span>
                <input name="tag" className={`${smallInputClass} w-32`} />
              </label>
              <label className="text-xs text-gray-500">
                25+ pcs (₱/pc)
                <input type="number" name="price25" min={0} className={`${smallInputClass} w-24`} />
              </label>
              <label className="text-xs text-gray-500">
                50+ pcs (₱/pc)
                <input type="number" name="price50" min={0} className={`${smallInputClass} w-24`} />
              </label>
              <label className="text-xs text-gray-500">
                100+ pcs (₱/pc)
                <input type="number" name="price100" min={0} className={`${smallInputClass} w-24`} />
              </label>
            </div>
            <label className="block text-xs text-gray-500">
              Description
              <input name="description" className={smallInputClass} />
            </label>
            <label className="block text-xs text-gray-500">
              Dishes <span className="text-gray-400">(one per line)</span>
              <textarea name="dishes" rows={3} className={smallInputClass} />
            </label>
            <button type="submit" className={addButtonClass}>
              + Add Category
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
