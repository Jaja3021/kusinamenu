"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type DishCategory,
  type SelectedDishes,
  type TrayCartLine,
  type PackedMealCartLine,
} from "@/lib/packages";
import { usePackages } from "@/context/PackagesContext";
import { DELIVERY_FEE } from "@/lib/pricing";

export type ScheduleInfo = {
  eventType: string;
  date: string;
  time: string;
  venue: string;
  instructions: string;
  branch: string;
  deliveryTime: string;
};

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
};

export type WizardDraft = {
  packageSlug: string | null;
  pax: number | null;
  menuId: string | null;
  cart: TrayCartLine[];
  selectedDishes: SelectedDishes;
  packedMealCart: PackedMealCartLine[];
  eventTypeSlug: string | null;
  scheduleInfo: ScheduleInfo;
  customerInfo: CustomerInfo;
  deliveryMethod: "delivery" | "pickup";
};

export type PlacedOrder = WizardDraft & {
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  placedAt: string;
};

const emptyDraft: WizardDraft = {
  packageSlug: null,
  pax: null,
  menuId: null,
  cart: [],
  selectedDishes: {},
  packedMealCart: [],
  eventTypeSlug: null,
  scheduleInfo: { eventType: "", date: "", time: "", venue: "", instructions: "", branch: "", deliveryTime: "" },
  customerInfo: { firstName: "", lastName: "", phone: "", email: "", address: "" },
  deliveryMethod: "delivery",
};

export type OrderPlacementResult = {
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  placedAt: string;
};

type WizardContextValue = {
  draft: WizardDraft;
  setPackage: (packageSlug: string) => void;
  setPax: (pax: number | null) => void;
  setMenu: (menuId: string) => void;
  addCartLine: (line: TrayCartLine) => void;
  removeCartLine: (index: number) => void;
  addPackedMealLine: (line: PackedMealCartLine) => void;
  removePackedMealLine: (index: number) => void;
  setSelectedDish: (category: DishCategory, dish: string) => void;
  setEventType: (eventTypeSlug: string) => void;
  setScheduleInfo: (scheduleInfo: ScheduleInfo) => void;
  setCustomerInfo: (customerInfo: CustomerInfo) => void;
  setDeliveryMethod: (method: "delivery" | "pickup") => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  lastOrder: PlacedOrder | null;
  // Records an order already verified + persisted server-side (see
  // app/order/confirm/actions.ts) — this no longer invents the order
  // number or totals itself, it just trusts the server's result.
  placeOrder: (
    scheduleInfo: ScheduleInfo,
    customerInfo: CustomerInfo,
    deliveryMethod: "delivery" | "pickup",
    result: OrderPlacementResult
  ) => void;
  resetDraft: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

const DRAFT_KEY = "kusinangPamana:wizardDraft";
const LAST_ORDER_KEY = "kusinangPamana:lastOrder";

// Backfills any fields missing from an older cached shape (e.g. saved before
// scheduleInfo/customerInfo/selectedDishes gained new keys) so stale
// localStorage data can never leave a field undefined.
function mergeDraft(stored: Partial<WizardDraft> | null | undefined): WizardDraft {
  return {
    ...emptyDraft,
    ...stored,
    cart: stored?.cart ?? emptyDraft.cart,
    selectedDishes: { ...emptyDraft.selectedDishes, ...stored?.selectedDishes },
    packedMealCart: stored?.packedMealCart ?? emptyDraft.packedMealCart,
    scheduleInfo: { ...emptyDraft.scheduleInfo, ...stored?.scheduleInfo },
    customerInfo: { ...emptyDraft.customerInfo, ...stored?.customerInfo },
  };
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const { resolveMenu } = usePackages();
  const [draft, setDraft] = useState<WizardDraft>(emptyDraft);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);
      if (rawDraft) setDraft(mergeDraft(JSON.parse(rawDraft)));
      const rawLast = window.localStorage.getItem(LAST_ORDER_KEY);
      if (rawLast) {
        const parsed = JSON.parse(rawLast);
        setLastOrder({ ...parsed, ...mergeDraft(parsed) });
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // customerInfo is never persisted — personal details reset on reload
    // instead of surviving indefinitely in localStorage.
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, customerInfo: emptyDraft.customerInfo })
    );
  }, [draft, hydrated]);

  function setPackage(packageSlug: string) {
    setDraft((d) => ({
      ...d,
      packageSlug,
      pax: null,
      menuId: null,
      cart: [],
      selectedDishes: {},
      packedMealCart: [],
    }));
  }

  function setPax(pax: number | null) {
    setDraft((d) => ({ ...d, pax, menuId: null }));
  }

  function setMenu(menuId: string) {
    setDraft((d) => ({ ...d, menuId }));
  }

  function addCartLine(line: TrayCartLine) {
    setDraft((d) => {
      const idx = d.cart.findIndex((l) => l.dishId === line.dishId && l.size === line.size);
      if (idx >= 0) {
        const next = [...d.cart];
        next[idx] = { ...next[idx], qty: next[idx].qty + line.qty };
        return { ...d, cart: next };
      }
      return { ...d, cart: [...d.cart, line] };
    });
  }

  function removeCartLine(index: number) {
    setDraft((d) => ({ ...d, cart: d.cart.filter((_, i) => i !== index) }));
  }

  function addPackedMealLine(line: PackedMealCartLine) {
    setDraft((d) => {
      const idx = d.packedMealCart.findIndex((l) => l.dishId === line.dishId);
      if (idx >= 0) {
        const next = [...d.packedMealCart];
        next[idx] = { ...next[idx], qty: next[idx].qty + line.qty };
        return { ...d, packedMealCart: next };
      }
      return { ...d, packedMealCart: [...d.packedMealCart, line] };
    });
  }

  function removePackedMealLine(index: number) {
    setDraft((d) => ({ ...d, packedMealCart: d.packedMealCart.filter((_, i) => i !== index) }));
  }

  function setSelectedDish(category: DishCategory, dish: string) {
    setDraft((d) => ({ ...d, selectedDishes: { ...d.selectedDishes, [category]: dish } }));
  }

  function setEventType(eventTypeSlug: string) {
    setDraft((d) => ({ ...d, eventTypeSlug }));
  }

  function setScheduleInfo(scheduleInfo: ScheduleInfo) {
    setDraft((d) => ({ ...d, scheduleInfo }));
  }

  function setCustomerInfo(customerInfo: CustomerInfo) {
    setDraft((d) => ({ ...d, customerInfo }));
  }

  function setDeliveryMethod(method: "delivery" | "pickup") {
    setDraft((d) => ({ ...d, deliveryMethod: method }));
  }

  function resetDraft() {
    setDraft(emptyDraft);
  }

  const menu = draft.packageSlug
    ? resolveMenu(draft.packageSlug, draft.pax, draft.menuId, draft.cart, draft.selectedDishes, draft.packedMealCart)
    : undefined;

  const subtotal = menu?.price ?? 0;
  const deliveryFee = draft.deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  function placeOrder(
    scheduleInfo: ScheduleInfo,
    customerInfo: CustomerInfo,
    deliveryMethod: "delivery" | "pickup",
    result: OrderPlacementResult
  ): void {
    const record: PlacedOrder = {
      packageSlug: draft.packageSlug,
      pax: draft.pax,
      menuId: draft.menuId,
      cart: draft.cart,
      selectedDishes: draft.selectedDishes,
      packedMealCart: draft.packedMealCart,
      eventTypeSlug: draft.eventTypeSlug,
      scheduleInfo,
      customerInfo,
      deliveryMethod,
      ...result,
    };
    setLastOrder(record);
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(record));
    resetDraft();
  }

  const value = useMemo(
    () => ({
      draft,
      setPackage,
      setPax,
      setMenu,
      addCartLine,
      removeCartLine,
      addPackedMealLine,
      removePackedMealLine,
      setSelectedDish,
      setEventType,
      setScheduleInfo,
      setCustomerInfo,
      setDeliveryMethod,
      subtotal,
      deliveryFee,
      total,
      lastOrder,
      placeOrder,
      resetDraft,
    }),
    [draft, subtotal, deliveryFee, total, lastOrder]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
