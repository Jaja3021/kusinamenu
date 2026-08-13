"use server";

import { after } from "next/server";
import { getPackagesData } from "@/lib/packages-data";
import {
  resolveMenu,
  isTrayCartPackage,
  isPackedMealPackage,
  type TrayCartLine,
  type PackedMealCartLine,
  type SelectedDishes,
} from "@/lib/packages";
import { transientSupabase } from "@/lib/supabase/transient";
import { DELIVERY_FEE, depositFor } from "@/lib/pricing";
import { sendEmail } from "@/lib/email";
import { orderPlacedEmail } from "@/lib/email-templates";
import type { ScheduleInfo, CustomerInfo, OrderPlacementResult } from "@/context/WizardContext";

export async function sendOrderOtp(email: string): Promise<{ error: string | null }> {
  const supabase = transientSupabase();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return { error: error?.message ?? null };
}

export type PlaceOrderInput = {
  packageSlug: string;
  pax: number | null;
  menuId: string | null;
  cart: TrayCartLine[];
  selectedDishes: SelectedDishes;
  packedMealCart: PackedMealCartLine[];
  scheduleInfo: ScheduleInfo;
  customerInfo: CustomerInfo;
  deliveryMethod: "delivery" | "pickup";
};

export type VerifyOtpResult = { ok: true; result: OrderPlacementResult } | { ok: false; error: string };

export async function verifyOtpAndPlaceOrder(code: string, input: PlaceOrderInput): Promise<VerifyOtpResult> {
  const email = input.customerInfo.email;

  const anonSupabase = transientSupabase();
  const { data: verifyData, error: verifyError } = await anonSupabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (verifyError || !verifyData.session) {
    return { ok: false, error: verifyError?.message ?? "That code didn't work — check it and try again." };
  }

  // Prices are never trusted from the client — recompute from the live
  // catalog using the same pure helpers the order-builder UI uses.
  const packages = await getPackagesData();
  const pkg = packages.find((p) => p.slug === input.packageSlug);
  const menu = resolveMenu(
    packages,
    input.packageSlug,
    input.pax,
    input.menuId,
    input.cart,
    input.selectedDishes,
    input.packedMealCart
  );
  if (!pkg || !menu) {
    return { ok: false, error: "This package is no longer available. Please start over from the menu." };
  }

  const subtotal = menu.price;
  const deliveryFee = input.deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const depositAmount = depositFor(total);
  const status = "Pending Confirmation";
  const placedAt = new Date().toISOString();

  const quantityLabel = isTrayCartPackage(pkg)
    ? `${input.cart.reduce((sum, line) => sum + line.qty, 0)} trays`
    : isPackedMealPackage(pkg)
    ? `${input.packedMealCart.reduce((sum, line) => sum + line.qty, 0)} pcs`
    : input.pax
    ? `${input.pax} pax`
    : null;

  // Scoped to the session just verified — satisfies the orders RLS insert
  // policy (`email = auth.email()`), so a customer can only ever file an
  // order under the email they proved ownership of. order_number is left
  // out: the column default (public.next_order_number(), supabase/
  // payments.sql §1) assigns a collision-proof value, and .select() reads
  // it back — allowed by the "Customer read own order" policy in the same
  // file, since PostgREST checks RETURNING against the SELECT policy.
  const authedSupabase = transientSupabase(verifyData.session.access_token);
  const { data: inserted, error: insertError } = await authedSupabase
    .from("orders")
    .insert({
      status,
      package_slug: pkg.slug,
      package_name: pkg.name,
      menu_id: input.menuId,
      menu_name: menu.name,
      menu_snapshot: menu,
      pax: input.pax,
      quantity_label: quantityLabel,
      cart: input.cart,
      packed_meal_cart: input.packedMealCart,
      selected_dishes: input.selectedDishes,
      event_type: input.scheduleInfo.eventType || null,
      event_date: input.scheduleInfo.date || null,
      event_time: input.scheduleInfo.time || null,
      venue: input.scheduleInfo.venue || null,
      instructions: input.scheduleInfo.instructions || null,
      branch: input.scheduleInfo.branch || null,
      delivery_time: input.scheduleInfo.deliveryTime || null,
      delivery_method: input.deliveryMethod,
      first_name: input.customerInfo.firstName,
      last_name: input.customerInfo.lastName,
      email: input.customerInfo.email,
      phone: input.customerInfo.phone,
      address: input.customerInfo.address || null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      deposit_amount: depositAmount,
    })
    .select("order_number")
    .single();

  if (insertError || !inserted) {
    return {
      ok: false,
      error: `Your code was verified, but saving the order failed: ${insertError?.message ?? "unknown error"}`,
    };
  }

  // Fired after the response is flushed so the customer never waits on the
  // mailer, and unlike a bare floating promise this is guaranteed to run
  // rather than risk being killed mid-flight on serverless. sendEmail()
  // never throws (see lib/email.ts) — a failed/unconfigured mailer must
  // never undo an order that already saved successfully.
  after(() =>
    sendEmail({
      to: input.customerInfo.email,
      ...orderPlacedEmail({
        firstName: input.customerInfo.firstName,
        orderNumber: inserted.order_number,
        total,
        depositAmount,
      }),
    })
  );

  return {
    ok: true,
    result: { orderNumber: inserted.order_number, status, subtotal, deliveryFee, total, placedAt },
  };
}
