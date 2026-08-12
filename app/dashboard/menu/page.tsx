import Link from "next/link";
import { getPackagesData } from "@/lib/packages-data";
import {
  isTrayCartPackage,
  isPackedMealPackage,
  isFixedMenuPackage,
  isHeadCountPackage,
  packageCategories,
  type PackageType,
} from "@/lib/packages";

function shapeLabel(pkg: PackageType): string {
  if (isTrayCartPackage(pkg)) return "Tray cart";
  if (isPackedMealPackage(pkg)) return "Packed meal";
  if (isHeadCountPackage(pkg)) return "Head-count";
  if (isFixedMenuPackage(pkg)) return "Fixed menu (Grazing)";
  return "Pax-tiered";
}

function itemCount(pkg: PackageType): string {
  if (isTrayCartPackage(pkg)) return `${pkg.trayCatalog?.length ?? 0} dishes`;
  if (isPackedMealPackage(pkg)) return `${pkg.packedMealCatalog?.length ?? 0} categories`;
  if (isHeadCountPackage(pkg)) return `₱${pkg.pricePerHead?.toLocaleString()}/head`;
  return `${pkg.paxTiers.length} pax tiers`;
}

export default async function DashboardMenuPage() {
  const packages = await getPackagesData();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-forest-dark">Menu</h1>
          <p className="mt-1 text-sm text-gray-600">
            Packages saved here are what customers see on the storefront immediately.
          </p>
        </div>
        <Link
          href="/dashboard/menu/new"
          className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          + New Package
        </Link>
      </div>

      {packageCategories.map((category) => {
        const items = packages.filter((p) => p.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{category}</p>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-gold-light/40 bg-white shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gold-light/40 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Shape</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((pkg) => (
                    <tr key={pkg.slug} className="border-b border-gold-light/20 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {pkg.name}
                          {pkg.recommended && (
                            <span className="ml-2 rounded-full bg-gold-light/40 px-2 py-0.5 text-xs font-semibold text-gold-dark">
                              Recommended
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{pkg.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{shapeLabel(pkg)}</td>
                      <td className="px-4 py-3 text-gray-600">{itemCount(pkg)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/menu/${pkg.slug}`}
                          className="font-medium text-forest hover:underline"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {packages.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-gold-light/60 p-8 text-center text-sm text-gray-500">
          No packages yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
