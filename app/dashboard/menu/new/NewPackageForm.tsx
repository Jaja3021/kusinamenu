"use client";

import { useState } from "react";
import { createPackageAction } from "../actions";
import { packageCategories, PACKAGE_BRANCHES } from "@/lib/packages";

const SHAPES = [
  { value: "pax-tiered", label: "Pax-tiered", hint: "Pick a pax size, one menu per tier (add tiers after creating)." },
  { value: "fixed-menu", label: "Fixed menu (Grazing)", hint: "Pick a pax size, whole spread is the menu." },
  { value: "tray-cart", label: "Tray cart", hint: "À la carte — add tray dishes after creating." },
  { value: "packed-meal", label: "Packed meal", hint: "Per-piece pricing — add categories after creating." },
  { value: "head-count", label: "Head-count", hint: "Flat rate per guest, build-your-own menu." },
] as const;

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

export function NewPackageForm() {
  const [shape, setShape] = useState<(typeof SHAPES)[number]["value"]>("pax-tiered");

  return (
    <form action={createPackageAction} className="mt-6 space-y-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
      <div>
        <p className="text-sm font-medium text-gray-700">Package Shape</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SHAPES.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition hover:bg-ivory-deep ${
                shape === s.value ? "border-forest bg-ivory-deep" : "border-gold-light/50"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input
                  type="radio"
                  name="shape"
                  value={s.value}
                  checked={shape === s.value}
                  onChange={() => setShape(s.value)}
                  className="h-4 w-4 accent-forest"
                />
                {s.label}
              </span>
              <span className="mt-1 text-xs text-gray-500">{s.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gold-light/40 pt-6 sm:grid-cols-2">
        <label className="text-sm">
          Slug (unique, url-safe) *
          <input name="slug" required pattern="[a-z0-9-]+" placeholder="e.g. combo-party-trays" className={inputClass} />
        </label>
        <label className="text-sm">
          Category *
          <select name="category" required className={inputClass}>
            {packageCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        Name *
        <input name="name" required placeholder="e.g. Combo Meal Party Trays" className={inputClass} />
      </label>

      <label className="block text-sm">
        Description *
        <textarea name="description" required rows={2} className={inputClass} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="recommended" className="h-4 w-4 accent-forest" />
        Mark as Recommended
      </label>

      <div>
        <p className="text-sm font-medium text-gray-700">
          Branches <span className="text-xs font-normal text-gray-400">(none checked = all branches)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          {PACKAGE_BRANCHES.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="branch" value={b.id} className="h-4 w-4 accent-forest" />
              {b.name}
            </label>
          ))}
        </div>
      </div>

      {shape === "head-count" && (
        <div className="grid grid-cols-1 gap-4 border-t border-gold-light/40 pt-6 sm:grid-cols-2">
          <label className="text-sm">
            Price per head (₱) *
            <input type="number" name="pricePerHead" required min={0} className={inputClass} />
          </label>
          <label className="text-sm">
            Minimum head count *
            <input type="number" name="minimumHeadCount" required min={1} className={inputClass} />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 border-t border-gold-light/40 pt-6 sm:grid-cols-2">
        <label className="text-sm">
          Inclusions <span className="text-xs font-normal text-gray-400">(one per line)</span>
          <textarea name="inclusions" rows={4} className={inputClass} />
        </label>
        <label className="text-sm">
          Add-ons <span className="text-xs font-normal text-gray-400">(one per line)</span>
          <textarea name="addOns" rows={4} className={inputClass} />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-full bg-gradient-to-r from-forest to-forest-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
      >
        Create Package
      </button>
    </form>
  );
}
