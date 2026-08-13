"use client";

import { WizardProvider } from "@/context/WizardContext";
import { PackagesProvider } from "@/context/PackagesContext";
import { MyOrdersProvider } from "@/context/MyOrdersContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PackagesProvider>
      <WizardProvider>
        <MyOrdersProvider>{children}</MyOrdersProvider>
      </WizardProvider>
    </PackagesProvider>
  );
}
