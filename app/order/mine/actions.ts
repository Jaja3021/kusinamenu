"use server";

import { loadTrackedOrder } from "@/app/order/track/actions";
import type { TrackedOrder } from "@/lib/payments";

export type OrderPointer = { orderNumber: string; contact: string };

// Resolves each device-remembered {orderNumber, contact} pointer (see
// context/MyOrdersContext.tsx) through the same lookup_order RPC the track
// page uses — always live from the database, never trusting anything about
// the order beyond its identity from localStorage. Pointers that no longer
// resolve (deleted order, contact no longer matches) are silently dropped
// from the result rather than erroring the whole list.
export async function getMyOrdersAction(pointers: OrderPointer[]): Promise<TrackedOrder[]> {
  const results = await Promise.all(
    pointers.map(async (p) => {
      const result = await loadTrackedOrder(p.orderNumber, p.contact);
      return result.ok ? result.order : null;
    })
  );
  return results.filter((o): o is TrackedOrder => o !== null);
}
