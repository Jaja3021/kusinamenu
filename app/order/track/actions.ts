"use server";

import { transientSupabase } from "@/lib/supabase/transient";
import type { TrackedOrder, CustomerPayment } from "@/lib/payments";

export type TrackResult = { ok: true; order: TrackedOrder } | { ok: false; error: string };

// Raw shape of one row from public.lookup_order (see supabase/payments.sql
// §8) — snake_case, as PostgREST/rpc() returns it.
type LookupOrderRow = {
  id: string;
  order_number: string;
  status: TrackedOrder["status"];
  package_name: string;
  menu_name: string | null;
  menu_snapshot: TrackedOrder["menuSnapshot"];
  quantity_label: string | null;
  pax: number | null;
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  branch: string | null;
  delivery_method: TrackedOrder["deliveryMethod"];
  delivery_time: string | null;
  address: string | null;
  instructions: string | null;
  first_name: string;
  last_name: string;
  email_masked: string | null;
  phone_masked: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  deposit_amount: number;
  amount_paid: number;
  payment_status: TrackedOrder["paymentStatus"];
  created_at: string;
};

type LookupPaymentRow = {
  id: string;
  kind: CustomerPayment["kind"];
  method: CustomerPayment["method"];
  amount: number;
  reference_number: string | null;
  status: CustomerPayment["status"];
  created_at: string;
  verified_at: string | null;
};

function rowToTrackedOrder(row: LookupOrderRow, payments: LookupPaymentRow[]): TrackedOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    packageName: row.package_name,
    menuName: row.menu_name,
    menuSnapshot: row.menu_snapshot,
    quantityLabel: row.quantity_label,
    pax: row.pax,
    eventType: row.event_type,
    eventDate: row.event_date,
    eventTime: row.event_time,
    venue: row.venue,
    branch: row.branch,
    instructions: row.instructions,
    deliveryMethod: row.delivery_method,
    deliveryTime: row.delivery_time,
    address: row.address,
    firstName: row.first_name,
    lastName: row.last_name,
    emailMasked: row.email_masked,
    phoneMasked: row.phone_masked,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    depositAmount: row.deposit_amount,
    amountPaid: row.amount_paid,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    payments: payments.map((p) => ({
      id: p.id,
      kind: p.kind,
      method: p.method,
      amount: p.amount,
      referenceNumber: p.reference_number,
      status: p.status,
      createdAt: p.created_at,
      verifiedAt: p.verified_at,
    })),
  };
}

// Per-instance throttle only — see supabase/payments.sql §13 for the
// cross-instance version if this ever runs on more than one server.
const attempts = new Map<string, { count: number; resetAt: number }>();

function allow(key: string, max = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

async function loadTrackedOrder(orderNumber: string, contact: string): Promise<TrackResult> {
  const supabase = transientSupabase();

  const { data: orderRows, error: orderError } = await supabase.rpc("lookup_order", {
    p_order_number: orderNumber,
    p_contact: contact,
  });
  if (orderError) {
    return { ok: false, error: "We couldn't look that up right now. Please try again." };
  }
  const row = (orderRows as LookupOrderRow[] | null)?.[0];
  // Deliberately the same message for "no such order" and "wrong contact" —
  // don't confirm that an order number exists to someone probing it.
  if (!row) {
    return { ok: false, error: "We couldn't find an order matching those details." };
  }

  const { data: paymentRows } = await supabase.rpc("lookup_order_payments", {
    p_order_number: orderNumber,
    p_contact: contact,
  });

  return { ok: true, order: rowToTrackedOrder(row, (paymentRows as LookupPaymentRow[] | null) ?? []) };
}

export async function lookupOrderAction(_prev: TrackResult | null, formData: FormData): Promise<TrackResult> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!orderNumber || !contact) {
    return { ok: false, error: "Enter your order number and email or mobile number." };
  }
  if (!allow(orderNumber.toUpperCase())) {
    return { ok: false, error: "Too many attempts for this order. Please wait a few minutes and try again." };
  }

  return loadTrackedOrder(orderNumber, contact);
}

// Maps the Postgres error codes/messages raised by begin_payment() (see
// supabase/payments.sql §10) to copy a customer can act on.
function friendlyRpcError(message: string): string {
  if (message.includes("PAYMENT_ALREADY_PENDING")) {
    return "You already have a payment submission in progress for this order. Please wait a few minutes and try again.";
  }
  if (message.includes("TOO_MANY_ATTEMPTS")) {
    return "Too many payment attempts on this order. Please contact us directly if this isn't you.";
  }
  if (message.includes("AMOUNT_EXCEEDS_BALANCE")) {
    return "That amount is more than what's left to pay on this order.";
  }
  if (message.includes("BAD_AMOUNT")) {
    return "Please enter a valid amount.";
  }
  if (message.includes("REFERENCE_REQUIRED")) {
    return "Please enter the reference number from your payment.";
  }
  if (message.includes("ORDER_NOT_FOUND")) {
    return "We couldn't find an order matching those details.";
  }
  return "We couldn't submit that payment right now. Please try again.";
}

// The begin -> upload -> finalize chain runs as one action deliberately:
// Server Actions dispatch sequentially per client, so splitting this into
// separate client-triggered calls buys no parallelism and risks leaving a
// stranded 'Pending Upload' row if the browser never calls the next step.
export async function submitPaymentAction(_prev: TrackResult | null, formData: FormData): Promise<TrackResult> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const method = String(formData.get("method") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const reference = String(formData.get("reference") ?? "").trim();
  const proof = formData.get("proof");

  if (!orderNumber || !contact) {
    return { ok: false, error: "Missing order details — please look up your order again." };
  }

  const supabase = transientSupabase();
  const ext = proof instanceof File && proof.name.includes(".") ? proof.name.split(".").pop()! : "jpg";

  const { data: beginData, error: beginError } = await supabase.rpc("begin_payment", {
    p_order_number: orderNumber,
    p_contact: contact,
    p_method: method,
    p_amount: amount,
    p_reference_number: reference,
    p_proof_ext: ext,
  });
  if (beginError) {
    return { ok: false, error: friendlyRpcError(beginError.message) };
  }
  const row = (beginData as { payment_id: string; proof_path: string | null }[] | null)?.[0];
  if (!row) {
    return { ok: false, error: "We couldn't submit that payment right now. Please try again." };
  }

  // Cash has no proof_path — begin_payment already inserted it as
  // 'Submitted', nothing left to do.
  if (row.proof_path) {
    if (!(proof instanceof File) || proof.size === 0) {
      return { ok: false, error: "Please attach a screenshot of your payment." };
    }
    const upload = await supabase.storage
      .from("payment-proofs")
      .upload(row.proof_path, proof, { contentType: proof.type || "image/jpeg", upsert: false });
    if (upload.error) {
      return { ok: false, error: "We couldn't save that screenshot. Please try again." };
    }

    const { data: finalized } = await supabase.rpc("finalize_payment", {
      p_order_number: orderNumber,
      p_contact: contact,
      p_payment_id: row.payment_id,
    });
    if (!finalized) {
      return { ok: false, error: "We couldn't confirm that upload. Please try again." };
    }
  }

  // Re-read the order so the page updates from one round trip — no second
  // client-side lookup call needed.
  return loadTrackedOrder(orderNumber, contact);
}
