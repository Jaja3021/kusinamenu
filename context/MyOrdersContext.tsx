"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMyOrdersAction, type OrderPointer } from "@/app/order/mine/actions";
import type { TrackedOrder } from "@/lib/payments";

// Deliberately separate from WizardContext's single-slot `lastOrder`: there
// is no customer login in this app (orders are anonymous, looked up by
// order number + contact — see app/order/track/actions.ts), so "my orders"
// means "order numbers this device has seen," persisted here, with every
// actual detail/status always re-fetched live from the database. An order
// placed on a different device/browser won't show up here — that's what
// /order/track (manual order number + contact entry) is for.
const POINTERS_KEY = "kusinangPamana:myOrders";

type MyOrdersContextValue = {
  orders: TrackedOrder[];
  // Raw {orderNumber, contact} pairs — needed alongside `orders` because
  // TrackedOrder only carries the MASKED email/phone (lookup_order's
  // deliberate design, see supabase/payments.sql §8). The My Orders page
  // needs the real contact value to build a Track Order deep link that can
  // auto-submit the lookup form.
  pointers: OrderPointer[];
  loading: boolean;
  // Count of orders not yet Completed/Cancelled — what the nav badge shows.
  // Completed/Cancelled orders stay in `orders` (order history) but drop out
  // of this count, per "remain until completed" — an order that's done
  // shouldn't keep inflating the badge forever.
  activeCount: number;
  addOrder: (orderNumber: string, contact: string) => void;
  refresh: () => void;
};

const MyOrdersContext = createContext<MyOrdersContextValue | null>(null);

export function MyOrdersProvider({ children }: { children: ReactNode }) {
  const [pointers, setPointers] = useState<OrderPointer[]>([]);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POINTERS_KEY);
      if (raw) setPointers(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(POINTERS_KEY, JSON.stringify(pointers));
  }, [pointers, hydrated]);

  const fetchOrders = useCallback(async (list: OrderPointer[]) => {
    if (list.length === 0) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      setOrders(await getMyOrdersAction(list));
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever the pointer list changes (a new order was just placed,
  // or the list just hydrated from localStorage).
  useEffect(() => {
    if (!hydrated) return;
    fetchOrders(pointers);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchOrders is stable (empty deps)
  }, [hydrated, pointers]);

  // No Supabase Realtime wiring — refetching on focus is enough for "the
  // customer sees an admin's status change without a hard refresh."
  useEffect(() => {
    function onFocus() {
      fetchOrders(pointers);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pointers, fetchOrders]);

  const addOrder = useCallback((orderNumber: string, contact: string) => {
    setPointers((prev) => (prev.some((p) => p.orderNumber === orderNumber) ? prev : [...prev, { orderNumber, contact }]));
  }, []);

  const activeCount = useMemo(
    () => orders.filter((o) => o.status !== "Completed" && o.status !== "Cancelled").length,
    [orders]
  );

  const value = useMemo<MyOrdersContextValue>(
    () => ({ orders, pointers, loading, activeCount, addOrder, refresh: () => fetchOrders(pointers) }),
    [orders, pointers, loading, activeCount, addOrder, fetchOrders]
  );

  return <MyOrdersContext.Provider value={value}>{children}</MyOrdersContext.Provider>;
}

export function useMyOrders() {
  const ctx = useContext(MyOrdersContext);
  if (!ctx) throw new Error("useMyOrders must be used within MyOrdersProvider");
  return ctx;
}
