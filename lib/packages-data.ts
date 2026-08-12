"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PackageType, PaxTier, TrayDish, PackedMealCategoryInfo } from "@/lib/packages";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type PackageRow = {
  slug: string;
  name: string;
  category: string;
  description: string;
  recommended: boolean;
  pax_tiers: PaxTier[];
  full_menu: PackageType["fullMenu"] | null;
  inclusions: string[];
  add_ons: string[];
  price_per_head: number | null;
  minimum_head_count: number | null;
  head_count_menu: PackageType["headCountMenu"] | null;
  tray_catalog: TrayDish[] | null;
  packed_meal_catalog: PackedMealCategoryInfo[] | null;
};

function rowToPackage(row: PackageRow): PackageType {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as PackageType["category"],
    description: row.description,
    recommended: row.recommended,
    paxTiers: row.pax_tiers ?? [],
    fullMenu: row.full_menu ?? undefined,
    inclusions: row.inclusions ?? [],
    addOns: row.add_ons ?? [],
    pricePerHead: row.price_per_head ?? undefined,
    minimumHeadCount: row.minimum_head_count ?? undefined,
    headCountMenu: row.head_count_menu ?? undefined,
    trayCatalog: row.tray_catalog ?? undefined,
    packedMealCatalog: row.packed_meal_catalog ?? undefined,
  };
}

function packageToRow(pkg: PackageType) {
  return {
    slug: pkg.slug,
    name: pkg.name,
    category: pkg.category,
    description: pkg.description,
    recommended: pkg.recommended ?? false,
    pax_tiers: pkg.paxTiers ?? [],
    full_menu: pkg.fullMenu ?? null,
    inclusions: pkg.inclusions ?? [],
    add_ons: pkg.addOns ?? [],
    price_per_head: pkg.pricePerHead ?? null,
    minimum_head_count: pkg.minimumHeadCount ?? null,
    head_count_menu: pkg.headCountMenu ?? null,
    tray_catalog: pkg.trayCatalog ?? null,
    packed_meal_catalog: pkg.packedMealCatalog ?? null,
  };
}

async function getPackageRow(supabase: SupabaseServerClient, slug: string): Promise<PackageRow> {
  const { data, error } = await supabase.from("packages").select("*").eq("slug", slug).single();
  if (error || !data) throw new Error(`Package "${slug}" not found.`);
  return data as PackageRow;
}

export async function getPackagesData(): Promise<PackageType[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load packages: ${error.message}`);
  return (data as PackageRow[]).map(rowToPackage);
}

export async function upsertPackage(pkg: PackageType): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("packages").upsert(packageToRow(pkg), { onConflict: "slug" });
  if (error) throw new Error(`Failed to save package "${pkg.slug}": ${error.message}`);
}

export async function deletePackage(slug: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("packages").delete().eq("slug", slug);
  if (error) throw new Error(`Failed to delete package "${slug}": ${error.message}`);
}

export async function upsertPaxTier(packageSlug: string, tier: PaxTier): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const paxTiers = row.pax_tiers ?? [];
  const idx = paxTiers.findIndex((t) => t.pax === tier.pax);
  const next = idx >= 0 ? paxTiers.map((t, i) => (i === idx ? tier : t)) : [...paxTiers, tier];
  const { error } = await supabase.from("packages").update({ pax_tiers: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to save pax tier: ${error.message}`);
}

export async function deletePaxTier(packageSlug: string, pax: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const next = (row.pax_tiers ?? []).filter((t) => t.pax !== pax);
  const { error } = await supabase.from("packages").update({ pax_tiers: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to delete pax tier: ${error.message}`);
}

export async function upsertTrayDish(packageSlug: string, dish: TrayDish): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const catalog = row.tray_catalog ?? [];
  const idx = catalog.findIndex((d) => d.id === dish.id);
  const next = idx >= 0 ? catalog.map((d, i) => (i === idx ? dish : d)) : [...catalog, dish];
  const { error } = await supabase.from("packages").update({ tray_catalog: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to save tray dish: ${error.message}`);
}

export async function deleteTrayDish(packageSlug: string, dishId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const next = (row.tray_catalog ?? []).filter((d) => d.id !== dishId);
  const { error } = await supabase.from("packages").update({ tray_catalog: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to delete tray dish: ${error.message}`);
}

export async function upsertPackedMealCategory(packageSlug: string, categoryInfo: PackedMealCategoryInfo): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const catalog = row.packed_meal_catalog ?? [];
  const idx = catalog.findIndex((c) => c.category === categoryInfo.category);
  const next = idx >= 0 ? catalog.map((c, i) => (i === idx ? categoryInfo : c)) : [...catalog, categoryInfo];
  const { error } = await supabase.from("packages").update({ packed_meal_catalog: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to save packed-meal category: ${error.message}`);
}

export async function deletePackedMealCategory(packageSlug: string, category: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const row = await getPackageRow(supabase, packageSlug);
  const next = (row.packed_meal_catalog ?? []).filter((c) => c.category !== category);
  const { error } = await supabase.from("packages").update({ packed_meal_catalog: next }).eq("slug", packageSlug);
  if (error) throw new Error(`Failed to delete packed-meal category: ${error.message}`);
}
