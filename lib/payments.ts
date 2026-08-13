import type { MenuVariant } from "@/lib/packages";
import type { OrderStatus } from "@/lib/orders";

// Mirrors supabase/payments.sql — kept in sync manually the same way
// lib/orders.ts mirrors supabase/orders.sql.

export const PAYMENT_METHODS = ["Cash", "GCash", "Bank Transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_KINDS = ["Deposit", "Balance", "Other"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ["Pending Upload", "Submitted", "Verified", "Rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = [
  "Unpaid",
  "Awaiting Verification",
  "Partially Paid",
  "Deposit Paid",
  "Paid",
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export type PaymentRecord = {
  id: string;
  orderId: string;
  kind: PaymentKind;
  method: PaymentMethod;
  amount: number;
  referenceNumber: string | null;
  // Admin-only. Never sent to the customer — see lookup_order_payments,
  // which omits it on purpose (a storage path is a capability).
  proofPath: string | null;
  status: PaymentStatus;
  adminNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

// A row in the admin verification queue: a payment joined to just enough
// of its order to identify it without a second round trip.
export type PaymentQueueRow = PaymentRecord & {
  orderNumber: string;
  customerName: string;
  orderTotal: number;
};

// What public.lookup_order_payments returns to an anonymous customer.
export type CustomerPayment = Pick<
  PaymentRecord,
  "id" | "kind" | "method" | "amount" | "referenceNumber" | "status" | "createdAt" | "verifiedAt"
>;

// What public.lookup_order returns, camelCased, plus the payment history
// fetched alongside it. This is the shape the /order/track page renders
// from — note it carries menuSnapshot directly, so the page never needs
// resolveMenu() (and can't hit the packed-meal blank-render bug).
export type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;

  packageName: string;
  menuName: string | null;
  menuSnapshot: MenuVariant;
  quantityLabel: string | null;
  pax: number | null;

  eventType: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  branch: string | null;
  instructions: string | null;
  deliveryMethod: "delivery" | "pickup";
  deliveryTime: string | null;
  address: string | null;

  firstName: string;
  lastName: string;
  emailMasked: string | null;
  phoneMasked: string | null;

  subtotal: number;
  deliveryFee: number;
  total: number;
  depositAmount: number;
  amountPaid: number;
  paymentStatus: OrderPaymentStatus;

  createdAt: string;
  payments: CustomerPayment[];
};

export function balanceDue(o: { total: number; amountPaid: number }): number {
  return Math.max(0, o.total - o.amountPaid);
}

// What a "pay now" button should default to: finish the deposit first,
// then whatever balance remains.
export function amountDueNow(o: { total: number; amountPaid: number; depositAmount: number }): number {
  return o.amountPaid < o.depositAmount ? o.depositAmount - o.amountPaid : balanceDue(o);
}
