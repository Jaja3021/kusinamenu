"use server";

import { createClient } from "@supabase/supabase-js";
import { getPackagesData } from "@/lib/packages-data";
import {
  resolveMenu,
  isTrayCartPackage,
  isPackedMealPackage,
  type TrayCartLine,
  type PackedMealCartLine,
  type SelectedDishes,
} from "@/lib/packages";
import type { ScheduleInfo, CustomerInfo, OrderPlacementResult } from "@/context/WizardContext";

// Deliberately NOT the cookie-bound client from lib/supabase/server.ts:
// verifying a customer's OTP here must never write a session cookie into
// the browser, or it would silently sign an admin's dashboard session out
// (or a customer's OTP session in) in the same browser.
function transientSupabase(accessToken?: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

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
  const deliveryFee = input.deliveryMethod === "delivery" ? 500 : 0;
  const total = subtotal + deliveryFee;
  const orderNumber = `KP-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
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
  // order under the email they proved ownership of.
  const authedSupabase = transientSupabase(verifyData.session.access_token);
  const { error: insertError } = await authedSupabase.from("orders").insert({
    order_number: orderNumber,
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
  });

  if (insertError) {
    return { ok: false, error: `Your code was verified, but saving the order failed: ${insertError.message}` };
  }

  return { ok: true, result: { orderNumber, status, subtotal, deliveryFee, total, placedAt } };
}
