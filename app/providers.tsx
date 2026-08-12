"use client";

import { WizardProvider } from "@/context/WizardContext";
import { PackagesProvider } from "@/context/PackagesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PackagesProvider>
      <WizardProvider>{children}</WizardProvider>
    </PackagesProvider>
  );
}
