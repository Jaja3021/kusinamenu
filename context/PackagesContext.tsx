"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { bindCatalog, type PackageType } from "@/lib/packages";
import { getPackagesData } from "@/lib/packages-data";

type BoundCatalog = ReturnType<typeof bindCatalog>;

type PackagesContextValue = BoundCatalog & {
  packages: PackageType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PackagesContext = createContext<PackagesContextValue | null>(null);

export function PackagesProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPackagesData();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<PackagesContextValue>(
    () => ({
      packages,
      loading,
      error,
      refresh,
      ...bindCatalog(packages),
    }),
    [packages, loading, error, refresh]
  );

  return <PackagesContext.Provider value={value}>{children}</PackagesContext.Provider>;
}

export function usePackages() {
  const ctx = useContext(PackagesContext);
  if (!ctx) throw new Error("usePackages must be used within PackagesProvider");
  return ctx;
}
