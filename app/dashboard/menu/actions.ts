"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  getPackagesData,
  upsertPackage,
  deletePackage,
  upsertPaxTier,
  deletePaxTier,
  upsertTrayDish,
  deleteTrayDish,
  upsertPackedMealCategory,
  deletePackedMealCategory,
} from "@/lib/packages-data";
import {
  trayDishId,
  packedMealQtyTiers,
  type PackageType,
  type PackageCategory,
  type TrayCategory,
  type PackedMealCategory,
} from "@/lib/packages";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0);
}

function lines(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function branches(formData: FormData): string[] | null {
  const values = formData.getAll("branch").map(String).filter(Boolean);
  return values.length > 0 ? values : null;
}

export async function createPackageAction(formData: FormData) {
  await requireAdmin();
  const shape = str(formData, "shape");
  const slug = str(formData, "slug");
  const category = str(formData, "category") as PackageCategory;

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug is required and must be lowercase letters, numbers, and hyphens only.");
  }

  const packages = await getPackagesData();
  if (packages.some((p) => p.slug === slug)) {
    throw new Error(`A package with slug "${slug}" already exists.`);
  }

  const base: PackageType = {
    slug,
    name: str(formData, "name"),
    category,
    description: str(formData, "description"),
    recommended: formData.get("recommended") === "on",
    paxTiers: [],
    inclusions: lines(formData, "inclusions"),
    addOns: lines(formData, "addOns"),
    branch: branches(formData),
    active: true,
  };

  if (shape === "head-count") {
    base.pricePerHead = num(formData, "pricePerHead");
    base.minimumHeadCount = num(formData, "minimumHeadCount");
    base.headCountMenu = { mains: [], sides: [], snacks: [] };
  } else if (shape === "tray-cart") {
    base.trayCatalog = [];
  } else if (shape === "packed-meal") {
    base.packedMealCatalog = [];
  }
  // "pax-tiered" and "fixed-menu" both just start with an empty paxTiers
  // array — tiers are added afterwards on the edit page.

  await upsertPackage(base);
  revalidatePath("/dashboard/menu");
  redirect(`/dashboard/menu/${slug}`);
}

export async function updatePackageDetailsAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug");
  const packages = await getPackagesData();
  const existing = packages.find((p) => p.slug === slug);
  if (!existing) throw new Error(`Package "${slug}" not found.`);

  const updated: PackageType = {
    ...existing,
    name: str(formData, "name"),
    category: str(formData, "category") as PackageCategory,
    description: str(formData, "description"),
    recommended: formData.get("recommended") === "on",
    inclusions: lines(formData, "inclusions"),
    addOns: lines(formData, "addOns"),
    branch: branches(formData),
  };

  if (existing.pricePerHead != null) {
    updated.pricePerHead = num(formData, "pricePerHead");
    updated.minimumHeadCount = num(formData, "minimumHeadCount");
  }

  await upsertPackage(updated);
  revalidatePath("/dashboard/menu");
  revalidatePath(`/dashboard/menu/${slug}`);
}

export async function deletePackageAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug");
  await deletePackage(slug);
  revalidatePath("/dashboard/menu");
  redirect("/dashboard/menu");
}

export async function savePaxTierAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const pax = num(formData, "pax");
  const paxLabel = str(formData, "paxLabel");
  const price = num(formData, "price");
  const menuName = str(formData, "menuName") || "Full Spread";

  await upsertPaxTier(packageSlug, {
    pax,
    paxLabel: paxLabel || undefined,
    menus: [
      {
        id: `${packageSlug}-${pax}`,
        name: menuName,
        price,
        mains: [],
        sides: [],
        snacks: [],
      },
    ],
  });
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}

export async function deletePaxTierAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const pax = num(formData, "pax");
  await deletePaxTier(packageSlug, pax);
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}

export async function saveTrayDishAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const name = str(formData, "name");
  const existingId = str(formData, "dishId");
  const id = existingId || trayDishId(name);

  await upsertTrayDish(packageSlug, {
    id,
    name,
    category: str(formData, "category") as TrayCategory,
    prices: {
      Family: num(formData, "priceFamily"),
      Feast: num(formData, "priceFeast"),
      XXXL: num(formData, "priceXXXL"),
    },
  });
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}

export async function deleteTrayDishAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const dishId = str(formData, "dishId");
  await deleteTrayDish(packageSlug, dishId);
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}

export async function savePackedMealCategoryAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const category = str(formData, "category") as PackedMealCategory;
  const tag = str(formData, "tag");

  await upsertPackedMealCategory(packageSlug, {
    category,
    tag: tag || undefined,
    description: str(formData, "description"),
    dishes: lines(formData, "dishes"),
    tiers: packedMealQtyTiers(num(formData, "price25"), num(formData, "price50"), num(formData, "price100")),
  });
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}

export async function deletePackedMealCategoryAction(formData: FormData) {
  await requireAdmin();
  const packageSlug = str(formData, "packageSlug");
  const category = str(formData, "category");
  await deletePackedMealCategory(packageSlug, category);
  revalidatePath(`/dashboard/menu/${packageSlug}`);
}
