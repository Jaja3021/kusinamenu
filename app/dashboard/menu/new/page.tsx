import Link from "next/link";
import { NewPackageForm } from "./NewPackageForm";

export default function NewPackagePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/menu" className="text-sm font-medium text-forest hover:underline">
        ← Back to Menu
      </Link>
      <h1 className="mt-4 font-serif text-3xl italic text-forest-dark">New Package</h1>
      <p className="mt-1 text-sm text-gray-600">
        Choose a shape and fill in the basics. Tiers, dishes, or categories are added on the next screen.
      </p>
      <NewPackageForm />
    </div>
  );
}
