"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper, FIXED_MENU_STEPS } from "@/components/Stepper";
import { BackButton } from "@/components/BackButton";
import { useWizard } from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import {
  isHeadCountPackage,
  isFixedMenuPackage,
  isTrayCartPackage,
  getTrayDish,
  getTrayCartTotal,
  isDishSelectionComplete,
  DISH_CATEGORIES,
  dishCatalog,
  TRAY_CATEGORIES,
  TRAY_SIZES,
  isPackedMealPackage,
  getPackedMealDish,
  getPackedMealTierPrice,
  getPackedMealCartTotal,
  getPackedMealCategoryPriceRange,
  packedMealDishId,
  type TrayCategory,
  type TraySize,
  type PackedMealCategory,
} from "@/lib/packages";

const QUICK_ADD = [5, 10, 15, 20];

export default function BuildPage() {
  const router = useRouter();
  const {
    draft,
    setPax,
    setMenu,
    addCartLine,
    removeCartLine,
    addPackedMealLine,
    removePackedMealLine,
    setSelectedDish,
  } = useWizard();
  const { getPackage, getPaxTier, loading } = usePackages();
  const pkg = draft.packageSlug ? getPackage(draft.packageSlug) : undefined;

  useEffect(() => {
    if (!loading && !pkg) router.replace("/");
  }, [pkg, loading, router]);

  const headCount = pkg && isHeadCountPackage(pkg);
  const [guests, setGuests] = useState<number>(() => draft.pax ?? pkg?.minimumHeadCount ?? 0);

  useEffect(() => {
    if (pkg && headCount) setGuests(draft.pax ?? pkg.minimumHeadCount ?? 0);
  }, [pkg, headCount, draft.pax]);

  const cartPkg = pkg ? isTrayCartPackage(pkg) : false;
  const [activeCategory, setActiveCategory] = useState<TrayCategory>(TRAY_CATEGORIES[0]);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<TraySize>("Family");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!pkg?.trayCatalog) return;
    const dishes = pkg.trayCatalog.filter((d) => d.category === activeCategory);
    if (dishes.length > 0) setSelectedDishId(dishes[0].id);
  }, [pkg, activeCategory]);

  const packedMealPkg = pkg ? isPackedMealPackage(pkg) : false;
  const [activePackedCategory, setActivePackedCategory] = useState<PackedMealCategory | "">("");
  const [selectedPackedDish, setSelectedPackedDish] = useState<string>("");
  const [packedQty, setPackedQty] = useState(25);

  useEffect(() => {
    if (!pkg?.packedMealCatalog) return;
    setActivePackedCategory(pkg.packedMealCatalog[0]?.category ?? "");
  }, [pkg]);

  useEffect(() => {
    if (!pkg?.packedMealCatalog || !activePackedCategory) return;
    const categoryInfo = pkg.packedMealCatalog.find((c) => c.category === activePackedCategory);
    if (categoryInfo && categoryInfo.dishes.length > 0) setSelectedPackedDish(categoryInfo.dishes[0]);
  }, [pkg, activePackedCategory]);

  const [selectedPax, setSelectedPax] = useState<number | null>(draft.pax ?? null);

  useEffect(() => {
    setSelectedPax(draft.pax ?? null);
  }, [pkg?.slug, draft.pax]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 text-center text-gray-500">Loading package…</div>;
  }
  if (!pkg) return null;

  const minimum = pkg.minimumHeadCount ?? 0;
  const menuHeading =
    pkg.slug === "grazing-table" ? "What's on the Table" : pkg.slug === "grazing-board" ? "What's on the Board" : "What's on the Menu";

  const skipsToDetails = isFixedMenuPackage(pkg);
  const stepperSteps = skipsToDetails ? FIXED_MENU_STEPS : undefined;
  const selectedTier = selectedPax !== null ? getPaxTier(pkg.slug, selectedPax) : undefined;
  const selectedPrice = selectedTier?.menus[0]?.price;

  function handleContinue() {
    if (selectedPax === null) return;
    const tier = getPaxTier(pkg!.slug, selectedPax);
    const firstMenu = tier?.menus[0];
    setPax(selectedPax);
    if (firstMenu) setMenu(firstMenu.id);
    router.push("/order/confirm");
  }

  function handleContinueHeadCount() {
    setPax(guests);
  }

  if (cartPkg) {
    const categoryDishes = (pkg.trayCatalog ?? []).filter((d) => d.category === activeCategory);
    const selectedDish = getTrayDish(pkg, selectedDishId);
    const unitPrice = selectedDish?.prices[selectedSize] ?? 0;
    const lineSubtotal = unitPrice * qty;
    const cartTotal = getTrayCartTotal(pkg, draft.cart);

    function handleAddToOrder() {
      if (!selectedDish) return;
      addCartLine({ dishId: selectedDish.id, size: selectedSize, qty });
      setQty(1);
    }

    return (
      <div className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <Stepper current={2} steps={stepperSteps} />

        <div className="mt-8">
          <BackButton onClick={() => router.push("/")} label="Change package" />
          <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
          <p className="mt-1 text-gray-600">
            Build your own trays — pick a category, choose a dish and size, then add it to your order.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-gold-light/40 pb-3">
          {TRAY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat ? "bg-forest text-white" : "text-gray-600 hover:bg-ivory-deep"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{activeCategory}</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="block text-sm sm:max-w-xs sm:flex-1">
              Dish
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              >
                {categoryDishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAY_SIZES.map((size) => (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => setSelectedSize(size.key)}
                  className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
                    selectedSize === size.key
                      ? "border-forest bg-forest text-white"
                      : "border-gold-light/50 text-gray-700 hover:bg-ivory-deep"
                  }`}
                >
                  {size.label}
                  <span className="block font-normal opacity-80">
                    {size.weight} · {size.servesLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gold-light/40 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Price</p>
              <p className="font-serif text-lg text-forest">₱{unitPrice.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-light/50 text-gray-700 hover:bg-ivory-deep"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-light/50 text-gray-700 hover:bg-ivory-deep"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Subtotal</p>
              <p className="font-serif text-lg text-forest">₱{lineSubtotal.toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToOrder}
              disabled={!selectedDish}
              className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-40"
            >
              Add to Order
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Your Order</p>
          {draft.cart.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-gold-light/60 p-4 text-center text-sm text-gray-500">
              No items yet. Choose a category, pick a dish, then tap Add to Order. You can adjust tray sizes
              after adding.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gold-light/30">
              {draft.cart.map((line, i) => {
                const dish = getTrayDish(pkg, line.dishId);
                const lineTotal = dish ? dish.prices[line.size] * line.qty : 0;
                return (
                  <li key={`${line.dishId}-${line.size}-${i}`} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{dish?.name ?? "Item"}</p>
                      <p className="text-xs text-gray-500">
                        {line.size} × {line.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-forest">₱{lineTotal.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => removeCartLine(i)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Inclusions</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {pkg.inclusions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Add-ons</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {pkg.addOns.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-forest-dark px-6 py-4 text-white shadow-lg">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gold-light hover:text-gold"
          >
            ← Back
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">Running Total</p>
            <p className="font-serif text-xl text-gold">{cartTotal > 0 ? `₱${cartTotal.toLocaleString()}` : "—"}</p>
          </div>
          <button
            type="button"
            disabled={draft.cart.length === 0}
            onClick={() => router.push("/order/review")}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-sm transition hover:shadow-md disabled:opacity-40"
          >
            Review Quote →
          </button>
        </div>
      </div>
    );
  }

  if (packedMealPkg) {
    const categories = pkg.packedMealCatalog ?? [];
    const activeCategoryInfo = categories.find((c) => c.category === activePackedCategory) ?? categories[0];
    const unitPrice = activeCategoryInfo ? getPackedMealTierPrice(activeCategoryInfo, packedQty) : 0;
    const lineTotal = unitPrice * packedQty;
    const cartTotal = getPackedMealCartTotal(pkg, draft.packedMealCart);

    function handleAddToOrder() {
      if (!selectedPackedDish) return;
      addPackedMealLine({ dishId: packedMealDishId(selectedPackedDish), qty: packedQty });
      setPackedQty(25);
    }

    return (
      <div className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <Stepper current={2} steps={stepperSteps} />

        <div className="mt-8">
          <BackButton onClick={() => router.push("/")} label="Change package" />
          <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
          <p className="mt-1 text-gray-600">
            Pick a category, choose a meal, set your quantity, then add it to your order.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((cat) => {
            const range = getPackedMealCategoryPriceRange(cat);
            const active = cat.category === activePackedCategory;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActivePackedCategory(cat.category)}
                className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                  active
                    ? "border-forest bg-ivory-deep ring-1 ring-forest/30"
                    : "border-gold-light/40 bg-white hover:border-gold"
                }`}
              >
                <p className="font-serif text-lg text-forest-dark">
                  {cat.category}
                  {cat.tag && (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-gold-dark">
                      ({cat.tag})
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm font-semibold text-gold-dark">
                  ₱{range.max.toLocaleString()}–₱{range.min.toLocaleString()} / pc
                </p>
                <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
              </button>
            );
          })}
        </div>

        {activeCategoryInfo && (
          <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Choose Meal</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="block text-sm">
                  Meal
                  <select
                    value={selectedPackedDish}
                    onChange={(e) => setSelectedPackedDish(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                  >
                    {activeCategoryInfo.dishes.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm">
                  Quantity (min {activeCategoryInfo.tiers[0].minQty} pcs)
                  <div>
                    <input
                      type="number"
                      min={activeCategoryInfo.tiers[0].minQty}
                      value={packedQty}
                      onChange={(e) =>
                        setPackedQty(Math.max(activeCategoryInfo.tiers[0].minQty, Number(e.target.value) || 0))
                      }
                      className="mt-1 w-32 rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                    />
                    <span className="ml-2 text-sm text-gray-500">pieces</span>
                  </div>
                </label>
              </div>
              <div className="rounded-xl border border-gold-light/40 bg-ivory-deep/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Pricing Tiers</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {[...activeCategoryInfo.tiers].reverse().map((tier) => (
                    <li
                      key={tier.label}
                      className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                        getPackedMealTierPrice(activeCategoryInfo, packedQty) === tier.pricePerPc
                          ? "bg-gold-light/40 font-semibold text-forest-dark"
                          : "text-gray-600"
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span>₱{tier.pricePerPc}/pc</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gold-light/40 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Total ({packedQty} × ₱{unitPrice.toLocaleString()})
                </p>
                <p className="font-serif text-lg text-forest">₱{lineTotal.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={handleAddToOrder}
                className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                Add to Order
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Your Order</p>
          {draft.packedMealCart.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-gold-light/60 p-4 text-center text-sm text-gray-500">
              No items yet. Choose a category, pick a meal, set quantity, then tap Add to Order.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gold-light/30">
              {draft.packedMealCart.map((line, i) => {
                const dish = getPackedMealDish(pkg, line.dishId);
                const lineItemTotal = dish ? getPackedMealTierPrice(dish.categoryInfo, line.qty) * line.qty : 0;
                return (
                  <li key={`${line.dishId}-${i}`} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{dish?.name ?? "Item"}</p>
                      <p className="text-xs text-gray-500">{line.qty} pcs</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-forest">₱{lineItemTotal.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => removePackedMealLine(i)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Inclusions</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {pkg.inclusions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Add-ons</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {pkg.addOns.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-forest-dark px-6 py-4 text-white shadow-lg">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gold-light hover:text-gold"
          >
            ← Back
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">Running Total</p>
            <p className="font-serif text-xl text-gold">{cartTotal > 0 ? `₱${cartTotal.toLocaleString()}` : "—"}</p>
          </div>
          <button
            type="button"
            disabled={draft.packedMealCart.length === 0}
            onClick={() => router.push("/order/review")}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-sm transition hover:shadow-md disabled:opacity-40"
          >
            Review Quote →
          </button>
        </div>
      </div>
    );
  }

  if (headCount) {
    const total = (pkg.pricePerHead ?? 0) * guests;

    if (!draft.pax) {
      return (
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-8">
          <Stepper current={2} steps={stepperSteps} />

          <div className="mt-8">
            <BackButton onClick={() => router.push("/")} label="Change package" />
            <div className="mt-4 flex items-start justify-between">
              <h1 className="font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
              <div className="text-right">
                <p className="font-serif text-xl text-forest">₱{pkg.pricePerHead?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">per head</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-forest-dark p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">Number of Guests</p>
                <p className="text-xs text-white/60">Minimum {minimum} pax</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">Total</p>
                <p className="font-serif text-xl font-semibold text-gold">₱{total.toLocaleString()}</p>
                <p className="text-xs text-white/60">Delivery quoted separately</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(minimum, g - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-semibold hover:bg-white/20"
              >
                −
              </button>
              <span className="w-16 text-center text-2xl font-bold">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => g + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-semibold hover:bg-white/20"
              >
                +
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">Quick Add</span>
              {QUICK_ADD.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGuests((g) => g + n)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Build Your Own Menu</p>
            <p className="mt-2 text-sm text-gray-600">
              On the next step, you&apos;ll pick one dish from each of 9 categories — Chicken, Fish &amp; Seafood,
              Pork, Beef, Vegetables, Soup, Dessert, Pasta, and Drinks.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Inclusions</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {pkg.inclusions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Add-ons</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {pkg.addOns.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueHeadCount}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md sm:w-auto"
          >
            Continue to Choose Dishes
          </button>
        </div>
      );
    }

    const allDishesSelected = isDishSelectionComplete(draft.selectedDishes);

    return (
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-8">
        <Stepper current={2} steps={stepperSteps} />

        <div className="mt-8">
          <BackButton onClick={() => setPax(null)} label="Change guest count" />
          <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
          <p className="mt-1 text-gray-600">
            Pick one dish from each category for your {guests}-guest menu.
          </p>
        </div>

        {DISH_CATEGORIES.map((category) => (
          <div
            key={category}
            className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{category}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dishCatalog[category].map((dish) => (
                <button
                  key={dish}
                  type="button"
                  onClick={() => setSelectedDish(category, dish)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition hover:bg-ivory-deep ${
                    draft.selectedDishes[category] === dish
                      ? "border-forest bg-ivory-deep font-semibold text-forest-dark"
                      : "border-gold-light/50 text-gray-600"
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-forest-dark px-6 py-4 text-white shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">
              {Object.keys(draft.selectedDishes).length} / {DISH_CATEGORIES.length} picked
            </p>
            <p className="font-serif text-xl text-gold">₱{total.toLocaleString()}</p>
          </div>
          <button
            type="button"
            disabled={!allDishesSelected}
            onClick={() => router.push("/order/review")}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-sm transition hover:shadow-md disabled:opacity-40"
          >
            Continue to Review →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-8">
      <Stepper current={2} steps={stepperSteps} />

      <div className="mt-8">
        <BackButton onClick={() => router.push("/")} label="Change package" />
        <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">{pkg.name}</h1>
        <p className="mt-1 text-gray-600">How many guests are you expecting?</p>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Choose Pax</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {pkg.paxTiers.map((tier) => {
            const price = tier.menus[0]?.price ?? 0;
            const active = selectedPax === tier.pax;
            return (
              <button
                key={tier.pax}
                type="button"
                onClick={() => setSelectedPax(tier.pax)}
                className={`flex-1 basis-40 rounded-2xl border px-4 py-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(27,58,46,0.25)] ${
                  active ? "border-forest bg-ivory-deep ring-1 ring-forest/30" : "border-gold-light/40 bg-white hover:border-gold"
                }`}
              >
                <p className="font-serif text-3xl text-forest">{tier.paxLabel ?? tier.pax}</p>
                <p className="text-sm text-gray-600">Pax</p>
                <p className="mt-2 font-serif text-lg text-gold-dark">₱{price.toLocaleString()}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{menuHeading}</p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
            {[
              ...(pkg.fullMenu?.mains ?? []),
              ...(pkg.fullMenu?.sides ?? []),
              ...(pkg.fullMenu?.snacks ?? []),
            ].map((dish) => (
              <p key={dish}>• {dish}</p>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Inclusions</p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 space-y-0 text-sm text-gray-600 sm:grid-cols-2">
            {pkg.inclusions.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Add-ons &amp; Notes</p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 space-y-0 text-sm text-gray-600 sm:grid-cols-2">
            {pkg.addOns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-forest-dark px-6 py-4 text-white shadow-lg">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm font-medium text-gold-light hover:text-gold"
        >
          ← Back
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-light/70">
            {selectedTier ? `${selectedTier.paxLabel ?? selectedTier.pax} Pax` : "Select pax"}
          </p>
          <p className="font-serif text-xl text-gold">
            {selectedPrice != null ? `₱${selectedPrice.toLocaleString()}` : "—"}
          </p>
        </div>
        <button
          type="button"
          disabled={selectedPax === null}
          onClick={handleContinue}
          className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-sm transition hover:shadow-md disabled:opacity-40"
        >
          Continue to Details →
        </button>
      </div>
    </div>
  );
}
