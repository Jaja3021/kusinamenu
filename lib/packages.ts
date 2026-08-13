export type Pax = number;

export const DISH_CATEGORIES = [
  "Chicken",
  "Fish & Seafood",
  "Pork",
  "Beef",
  "Vegetables",
  "Soup",
  "Dessert",
  "Pasta",
  "Drinks",
] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

export type SelectedDishes = Partial<Record<DishCategory, string>>;

export const dishCatalog: Record<DishCategory, string[]> = {
  Chicken: [
    "Chicken Adobo",
    "Chicken Inasal",
    "Chicken Curry",
    "Chicken Afritada",
    "Buttered Chicken",
    "Chicken Teriyaki",
    "Fried Chicken",
    "Chicken Cordon Bleu",
    "Chicken Pastel",
    "Salted Egg Chicken",
  ],
  "Fish & Seafood": [
    "Grilled Bangus",
    "Kinilaw na Tanigue",
    "Sinigang na Hipon",
    "Garlic Butter Shrimp",
    "Fish Fillet with Tartar Sauce",
    "Escabeche",
    "Ginataang Alimasag",
    "Pinaputok na Tilapia",
    "Camaron Rebosado",
    "Sweet and Sour Fish",
  ],
  Pork: [
    "Pork Menudo",
    "Lechon Kawali",
    "Crispy Pork Sisig",
    "Pork Sinigang",
    "Pork Binagoongan",
    "Pork Caldereta",
    "Bicol Express",
    "Pork Barbecue",
    "Pork Giniling",
    "Humba",
  ],
  Beef: [
    "Beef Caldereta",
    "Beef Kare-Kare",
    "Beef Mechado",
    "Beef Bulalo",
    "Crispy Beef Tapa",
    "Beef Nilaga",
    "Bistek Tagalog",
    "Beef Salpicao",
    "Beef Morcon",
    "Lengua Estofado",
  ],
  Vegetables: [
    "Pinakbet",
    "Chopsuey",
    "Ginataang Gulay",
    "Laing",
    "Dinengdeng",
    "Ginisang Ampalaya",
    "Buttered Mixed Vegetables",
    "Ginataang Kalabasa",
    "Adobong Kangkong",
    "Lumpiang Gulay",
  ],
  Soup: [
    "Nilagang Baka",
    "Bulalo Soup",
    "Sinigang na Baboy",
    "Tinolang Manok",
    "Molo Soup",
    "Law-uy",
    "Utan Bisaya",
    "Ginataang Munggo",
    "Corn Soup",
    "La Paz Batchoy",
  ],
  Dessert: [
    "Leche Flan",
    "Halo-Halo",
    "Turon",
    "Buko Pandan",
    "Maja Blanca",
    "Bibingka",
    "Puto",
    "Cassava Cake",
    "Ube Halaya",
    "Sapin-Sapin",
  ],
  Pasta: [
    "Filipino-Style Spaghetti",
    "Baked Mac",
    "Creamy Carbonara",
    "Rolled Lasagna",
    "Pancit Canton",
    "Pancit Bihon",
    "Pancit Palabok",
    "Baked Macaroni Salad",
    "Bam-i",
    "Sotanghon Guisado",
  ],
  Drinks: [
    "Brewed Coffee",
    "Iced Tea",
    "Four Seasons Juice",
    "Blue Lemonade",
    "Pink Lychee Juice",
    "Sago't Gulaman",
    "Buko Juice",
    "Calamansi Juice",
    "Melon Juice",
    "Bottled Water",
  ],
};

const HEADCOUNT_MAIN_CATEGORIES: DishCategory[] = ["Chicken", "Fish & Seafood", "Pork", "Beef"];
const HEADCOUNT_SIDE_CATEGORIES: DishCategory[] = ["Vegetables", "Soup", "Pasta"];
const HEADCOUNT_SNACK_CATEGORIES: DishCategory[] = ["Dessert", "Drinks"];

export function isDishSelectionComplete(selections: SelectedDishes): boolean {
  return DISH_CATEGORIES.every((category) => !!selections[category]);
}

export type MenuVariant = {
  id: string;
  name: string;
  price: number;
  mains: string[];
  sides: string[];
  snacks: string[];
};

export type DishSet = {
  mains: string[];
  sides: string[];
  snacks: string[];
};

export type PaxTier = {
  pax: Pax;
  paxLabel?: string;
  menus: MenuVariant[];
};

export type PackageCategory = "Tray Orders" | "Grazing" | "Full-Service Catering";

export type TraySize = "Family" | "Feast" | "XXXL";

export type TraySizeInfo = {
  key: TraySize;
  label: string;
  weight: string;
  servesLabel: string;
};

export const TRAY_SIZES: TraySizeInfo[] = [
  { key: "Family", label: "Family", weight: "1kg", servesLabel: "4-5 pax" },
  { key: "Feast", label: "Feast", weight: "2kg", servesLabel: "10-12 pax" },
  { key: "XXXL", label: "XXXL", weight: "5kg", servesLabel: "20-25 pax" },
];

export const TRAY_CATEGORIES = ["Beef", "Seafood", "Pork", "Chicken", "Pasta", "Dessert", "Rice"] as const;
export type TrayCategory = (typeof TRAY_CATEGORIES)[number];

export type TrayDish = {
  id: string;
  name: string;
  category: TrayCategory;
  prices: Record<TraySize, number>;
};

export type TrayCartLine = {
  dishId: string;
  size: TraySize;
  qty: number;
};

export type PackedMealCategory = "Snacks" | "Salad / Noodles" | "Rice Meals" | "Premium Rice Meals";
export const PACKED_MEAL_CATEGORIES: PackedMealCategory[] = [
  "Snacks",
  "Salad / Noodles",
  "Rice Meals",
  "Premium Rice Meals",
];

export function packedMealQtyTiers(t25: number, t50: number, t100: number): PackedMealQtyTier[] {
  return [
    { minQty: 25, label: "25+ pcs", pricePerPc: t25 },
    { minQty: 50, label: "50+ pcs", pricePerPc: t50 },
    { minQty: 100, label: "100+ pcs", pricePerPc: t100 },
  ];
}

export type PackedMealQtyTier = {
  minQty: number;
  label: string;
  pricePerPc: number;
};

export type PackedMealCategoryInfo = {
  category: PackedMealCategory;
  tag?: string;
  description: string;
  dishes: string[];
  tiers: PackedMealQtyTier[];
};

export type PackedMealCartLine = {
  dishId: string;
  qty: number;
};

export type PackageType = {
  slug: string;
  name: string;
  category: PackageCategory;
  description: string;
  recommended?: boolean;
  paxTiers: PaxTier[];
  fullMenu?: DishSet;
  inclusions: string[];
  addOns: string[];
  pricePerHead?: number;
  minimumHeadCount?: number;
  headCountMenu?: DishSet;
  trayCatalog?: TrayDish[];
  packedMealCatalog?: PackedMealCategoryInfo[];
  // Serving areas this package is offered at. Null/empty = every branch.
  // Informational only — the order flow doesn't filter on it (branch is
  // chosen at checkout, in app/order/confirm/page.tsx).
  branch?: string[] | null;
};

export type PackageBranch = { id: string; name: string };

// Mirrors the BRANCHES ids used at checkout (app/order/confirm/page.tsx).
export const PACKAGE_BRANCHES: PackageBranch[] = [
  { id: "cavite", name: "Cavite" },
  { id: "laguna", name: "Laguna" },
  { id: "metro-manila", name: "Metro Manila" },
];

// Grazing packages have no menu to choose — the whole spread is the menu,
// so each pax tier gets exactly one price instead of three variants. Kept
// here (not seed-only) because the dashboard's fixed-menu tier editor reuses
// it to build a tier from a price + label.
export type FixedMenuTierSpec = [pax: Pax, price: number, paxLabel?: string];

export function buildFixedMenuTiers(
  slug: string,
  mains: string[],
  sides: string[],
  snacks: string[],
  specs: FixedMenuTierSpec[]
): PaxTier[] {
  return specs.map(([pax, price, paxLabel]) => ({
    pax,
    paxLabel,
    menus: [
      {
        id: `${slug}-${pax}`,
        name: "Full Spread",
        price,
        mains,
        sides,
        snacks,
      },
    ],
  }));
}

export function trayDishId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function packedMealDishId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export const packageCategories: PackageCategory[] = ["Tray Orders", "Grazing", "Full-Service Catering"];

export function getPackage(packages: PackageType[], slug: string): PackageType | undefined {
  return packages.find((p) => p.slug === slug);
}

export function getPaxTier(packages: PackageType[], packageSlug: string, pax: number): PaxTier | undefined {
  return getPackage(packages, packageSlug)?.paxTiers.find((t) => t.pax === pax);
}

export function getMenu(packages: PackageType[], packageSlug: string, pax: number, menuId: string): MenuVariant | undefined {
  return getPaxTier(packages, packageSlug, pax)?.menus.find((m) => m.id === menuId);
}

export function getPriceRange(pkg: PackageType): { min: number; max: number } {
  const prices = pkg.paxTiers.flatMap((t) => t.menus.map((m) => m.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getPaxSizes(pkg: PackageType): Pax[] {
  return pkg.paxTiers.map((t) => t.pax);
}

export function getPaxSizeLabels(pkg: PackageType): string[] {
  return pkg.paxTiers.map((t) => t.paxLabel ?? String(t.pax));
}

export function getPaxLabel(packages: PackageType[], packageSlug: string, pax: number): string {
  return getPaxTier(packages, packageSlug, pax)?.paxLabel ?? String(pax);
}

export function getMinimumPax(pkg: PackageType): Pax {
  if (pkg.minimumHeadCount != null) return pkg.minimumHeadCount;
  return pkg.paxTiers[0].pax;
}

export function getRatePerHead(pkg: PackageType): number {
  if (pkg.pricePerHead != null) return pkg.pricePerHead;
  const first = pkg.paxTiers[0];
  const minPrice = Math.min(...first.menus.map((m) => m.price));
  return Math.round(minPrice / first.pax);
}

export function isHeadCountPackage(pkg: PackageType): boolean {
  return pkg.pricePerHead != null;
}

// Grazing packages skip menu selection — picking a pax size is the whole flow.
export function isFixedMenuPackage(pkg: PackageType): boolean {
  return pkg.category === "Grazing";
}

export function getHeadCountMenu(pkg: PackageType, guests: number, selections?: SelectedDishes): MenuVariant {
  const menu =
    selections && isDishSelectionComplete(selections)
      ? {
          mains: HEADCOUNT_MAIN_CATEGORIES.map((c) => selections[c]!),
          sides: HEADCOUNT_SIDE_CATEGORIES.map((c) => selections[c]!),
          snacks: HEADCOUNT_SNACK_CATEGORIES.map((c) => selections[c]!),
        }
      : pkg.headCountMenu ?? { mains: [], sides: [], snacks: [] };
  return {
    id: `${pkg.slug}-headcount`,
    name: pkg.name,
    price: (pkg.pricePerHead ?? 0) * guests,
    mains: menu.mains,
    sides: menu.sides,
    snacks: menu.snacks,
  };
}

export function isTrayCartPackage(pkg: PackageType): boolean {
  return pkg.trayCatalog != null;
}

export function getTrayDish(pkg: PackageType, dishId: string): TrayDish | undefined {
  return pkg.trayCatalog?.find((d) => d.id === dishId);
}

export function getTrayCartTotal(pkg: PackageType, cart: TrayCartLine[]): number {
  return cart.reduce((sum, line) => {
    const dish = getTrayDish(pkg, line.dishId);
    return sum + (dish ? dish.prices[line.size] * line.qty : 0);
  }, 0);
}

export function getTrayCartMenu(pkg: PackageType, cart: TrayCartLine[]): MenuVariant {
  const mains = cart.map((line) => {
    const dish = getTrayDish(pkg, line.dishId);
    const name = dish?.name ?? "Item";
    const lineTotal = dish ? dish.prices[line.size] * line.qty : 0;
    return `${name} — ${line.size} ×${line.qty} (₱${lineTotal.toLocaleString()})`;
  });
  return {
    id: `${pkg.slug}-cart`,
    name: "Your Custom Order",
    price: getTrayCartTotal(pkg, cart),
    mains,
    sides: [],
    snacks: [],
  };
}

export function getTrayPriceRange(pkg: PackageType): { min: number; max: number } {
  const prices = (pkg.trayCatalog ?? []).flatMap((d) => Object.values(d.prices));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function isPackedMealPackage(pkg: PackageType): boolean {
  return pkg.packedMealCatalog != null;
}

export function getPackedMealDish(
  pkg: PackageType,
  dishId: string
): { name: string; categoryInfo: PackedMealCategoryInfo } | undefined {
  for (const categoryInfo of pkg.packedMealCatalog ?? []) {
    const name = categoryInfo.dishes.find((d) => packedMealDishId(d) === dishId);
    if (name) return { name, categoryInfo };
  }
  return undefined;
}

export function getPackedMealTierPrice(categoryInfo: PackedMealCategoryInfo, qty: number): number {
  const tiers = categoryInfo.tiers;
  let price = tiers[0].pricePerPc;
  for (const tier of tiers) {
    if (qty >= tier.minQty) price = tier.pricePerPc;
  }
  return price;
}

export function getPackedMealCartTotal(pkg: PackageType, cart: PackedMealCartLine[]): number {
  return cart.reduce((sum, line) => {
    const dish = getPackedMealDish(pkg, line.dishId);
    return sum + (dish ? getPackedMealTierPrice(dish.categoryInfo, line.qty) * line.qty : 0);
  }, 0);
}

export function getPackedMealCartMenu(pkg: PackageType, cart: PackedMealCartLine[]): MenuVariant {
  const mains = cart.map((line) => {
    const dish = getPackedMealDish(pkg, line.dishId);
    const name = dish?.name ?? "Item";
    const lineTotal = dish ? getPackedMealTierPrice(dish.categoryInfo, line.qty) * line.qty : 0;
    return `${name} — ${line.qty} pcs (₱${lineTotal.toLocaleString()})`;
  });
  return {
    id: `${pkg.slug}-cart`,
    name: "Your Custom Order",
    price: getPackedMealCartTotal(pkg, cart),
    mains,
    sides: [],
    snacks: [],
  };
}

export function getPackedMealPriceRange(pkg: PackageType): { min: number; max: number } {
  const prices = (pkg.packedMealCatalog ?? []).flatMap((c) => c.tiers.map((t) => t.pricePerPc));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getPackedMealCategoryPriceRange(categoryInfo: PackedMealCategoryInfo): { min: number; max: number } {
  const prices = categoryInfo.tiers.map((t) => t.pricePerPc);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function resolveMenu(
  packages: PackageType[],
  packageSlug: string,
  pax: number | null,
  menuId: string | null,
  cart?: TrayCartLine[],
  selectedDishes?: SelectedDishes,
  packedMealCart?: PackedMealCartLine[]
): MenuVariant | undefined {
  const pkg = getPackage(packages, packageSlug);
  if (!pkg) return undefined;
  if (isTrayCartPackage(pkg)) {
    return cart && cart.length > 0 ? getTrayCartMenu(pkg, cart) : undefined;
  }
  if (isPackedMealPackage(pkg)) {
    return packedMealCart && packedMealCart.length > 0 ? getPackedMealCartMenu(pkg, packedMealCart) : undefined;
  }
  if (isHeadCountPackage(pkg)) return pax ? getHeadCountMenu(pkg, pax, selectedDishes) : undefined;
  return pax && menuId ? getMenu(packages, packageSlug, pax, menuId) : undefined;
}

// Binds the catalog-scoped helpers (the ones that otherwise need `packages`
// as their first argument) to a specific snapshot, so callers that already
// have `usePackages()`'s `packages` array can call `getPackage(slug)` instead
// of `getPackage(packages, slug)` at every call site.
export function bindCatalog(packages: PackageType[]) {
  return {
    getPackage: (slug: string) => getPackage(packages, slug),
    getPaxTier: (packageSlug: string, pax: number) => getPaxTier(packages, packageSlug, pax),
    getMenu: (packageSlug: string, pax: number, menuId: string) => getMenu(packages, packageSlug, pax, menuId),
    getPaxLabel: (packageSlug: string, pax: number) => getPaxLabel(packages, packageSlug, pax),
    resolveMenu: (
      packageSlug: string,
      pax: number | null,
      menuId: string | null,
      cart?: TrayCartLine[],
      selectedDishes?: SelectedDishes,
      packedMealCart?: PackedMealCartLine[]
    ) => resolveMenu(packages, packageSlug, pax, menuId, cart, selectedDishes, packedMealCart),
  };
}
