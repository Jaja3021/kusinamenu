import type { TrayCartLine, PackedMealCartLine, SelectedDishes, MenuVariant } from "@/lib/packages";
import type { OrderPaymentStatus } from "@/lib/payments";

export type OrderStatus = "Pending Confirmation" | "Confirmed" | "Preparing" | "Completed" | "Cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["Pending Confirmation", "Confirmed", "Preparing", "Completed", "Cancelled"];

// Mirrors the `orders` table (supabase/orders.sql) — a denormalized
// snapshot of what was ordered, so later menu edits never change a
// placed order retroactively.
export type OrderRecord = {
  id: string;
  orderNumber: string;
  status: OrderStatus;

  packageSlug: string;
  packageName: string;
  menuId: string | null;
  menuName: string | null;
  menuSnapshot: MenuVariant;
  pax: number | null;
  quantityLabel: string | null;
  cart: TrayCartLine[];
  packedMealCart: PackedMealCartLine[];
  selectedDishes: SelectedDishes;

  eventType: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  instructions: string | null;
  branch: string | null;
  deliveryTime: string | null;
  deliveryMethod: "delivery" | "pickup";

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;

  subtotal: number;
  deliveryFee: number;
  total: number;

  // Derived server-side (supabase/payments.sql) — amountPaid/paymentStatus
  // are recomputed by a trigger on `payments` and must never be written by
  // application code. depositAmount is a snapshot taken at order time.
  depositAmount: number;
  amountPaid: number;
  paymentStatus: OrderPaymentStatus;

  createdAt: string;
  updatedAt: string;
};
