"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, getCurrentUser } from "@/lib/admin";
import type { PaymentRecord, PaymentQueueRow, PaymentStatus } from "@/lib/payments";

// Note: unlike lib/orders-data.ts (which relies on its callers checking
// admin), every export here calls requireAdmin() itself — these are
// "use server" exports, so each one is an independently POST-able public
// endpoint regardless of what UI links to it.

type PaymentRow = {
  id: string;
  order_id: string;
  kind: PaymentRecord["kind"];
  method: PaymentRecord["method"];
  amount: number;
  reference_number: string | null;
  proof_path: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    kind: row.kind,
    method: row.method,
    amount: row.amount,
    referenceNumber: row.reference_number,
    proofPath: row.proof_path,
    status: row.status,
    adminNote: row.admin_note,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type QueueRow = PaymentRow & {
  orders: { order_number: string; first_name: string; last_name: string; total: number } | null;
};

function rowToQueueRow(row: QueueRow): PaymentQueueRow {
  return {
    ...rowToPayment(row),
    orderNumber: row.orders?.order_number ?? "—",
    customerName: row.orders ? `${row.orders.first_name} ${row.orders.last_name}` : "—",
    orderTotal: row.orders?.total ?? 0,
  };
}

// Excludes 'Pending Upload' by default — those rows have no file yet (the
// customer may still be mid-upload or abandoned the form) and aren't
// actionable by an admin. Pass a status explicitly to see a narrower slice.
export async function getPaymentQueue(status?: PaymentStatus): Promise<PaymentQueueRow[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("payments")
    .select("*, orders!inner(order_number, first_name, last_name, total)")
    .order("created_at", { ascending: false });
  query = status ? query.eq("status", status) : query.neq("status", "Pending Upload");
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load payment queue: ${error.message}`);
  return (data as QueueRow[]).map(rowToQueueRow);
}

export async function getPayment(id: string): Promise<PaymentQueueRow | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, orders!inner(order_number, first_name, last_name, total)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load payment: ${error.message}`);
  return data ? rowToQueueRow(data as QueueRow) : null;
}

export async function getPaymentsForOrder(orderId: string): Promise<PaymentRecord[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load payments: ${error.message}`);
  return (data as PaymentRow[]).map(rowToPayment);
}

// orders.amount_paid / payment_status are NOT touched here — the trigger
// in supabase/payments.sql §5 recomputes both from this table.
export async function setPaymentStatus(
  id: string,
  status: Extract<PaymentStatus, "Verified" | "Rejected">,
  adminNote?: string
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("payments")
    .update({
      status,
      admin_note: adminNote || null,
      verified_at: new Date().toISOString(),
      verified_by: user?.id ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update payment status: ${error.message}`);
}

export async function getProofSignedUrl(path: string, ttlSeconds = 60): Promise<string | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
