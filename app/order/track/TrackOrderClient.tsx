"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { lookupOrderAction, type TrackResult } from "./actions";
import { useWizard } from "@/context/WizardContext";
import { PaymentSection } from "@/components/PaymentSection";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { balanceDue, type TrackedOrder } from "@/lib/payments";

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  Unpaid: "bg-gray-100 text-gray-600",
  "Awaiting Verification": "bg-gold-light/40 text-gold-dark",
  "Partially Paid": "bg-gold-light/40 text-gold-dark",
  "Deposit Paid": "bg-forest/10 text-forest-dark",
  Paid: "bg-forest text-white",
};

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const { lastOrder } = useWizard();
  const [lookup, lookupAction, lookingUp] = useActionState<TrackResult | null, FormData>(lookupOrderAction, null);
  // Lets a successful payment submission (which re-reads the order inside
  // submitPaymentAction) replace what's on screen without a second lookup.
  const [paidOrder, setPaidOrder] = useState<TrackedOrder | null>(null);
  // True while PaymentSection has unsaved input (reference typed, screenshot
  // chosen, or mid-submit) — see the focus effect below.
  const [paymentFormDirty, setPaymentFormDirty] = useState(false);

  const order = paidOrder ?? (lookup?.ok ? lookup.order : null);
  // ?contact= lets My Orders' "Track Order" button (app/order/mine/page.tsx)
  // deep-link straight into a resolved order without the customer re-typing
  // it — falls back to the last order placed on this device, same as before.
  const [contact, setContact] = useState(searchParams.get("contact") ?? lastOrder?.customerInfo.email ?? "");

  const formRef = useRef<HTMLFormElement>(null);
  const refreshFormRef = useRef<HTMLFormElement>(null);

  // Auto-submit once on mount when both params are present, so a My Orders
  // deep link lands directly on the order instead of a pre-filled-but-idle
  // form the customer still has to click through.
  useEffect(() => {
    if (searchParams.get("order") && searchParams.get("contact")) {
      formRef.current?.requestSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  // No Supabase Realtime subscription — refetching whenever the tab regains
  // focus is enough for "the customer sees an admin's status change without
  // a full page reload," and needs no extra infrastructure. Skipped while
  // PaymentSection is dirty: opening the file picker to attach a screenshot
  // blurs the window, and refocusing after picking a file used to fire this
  // refresh mid-fill, swapping `order` out from under the still-open form.
  useEffect(() => {
    if (!order) return;
    const currentOrder = order;
    function onFocus() {
      // Once the balance hits 0, PaymentSection unmounts and there's no
      // form left to protect — an order object that stays "dirty" forever
      // (there's no unmount cleanup to reset it) shouldn't keep blocking
      // refresh after that point.
      if (paymentFormDirty && balanceDue(currentOrder) > 0) return;
      refreshFormRef.current?.requestSubmit();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [order, paymentFormDirty]);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
        <h1 className="font-serif text-3xl italic text-forest-dark">Track Your Order</h1>
        <p className="mt-2 text-gray-600">
          Enter your order number and the email or mobile number you booked with.
        </p>

        <form ref={formRef} action={lookupAction} className="mt-6 space-y-4 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <label className="block text-sm">
            Order Number *
            <input
              type="text"
              name="orderNumber"
              required
              defaultValue={searchParams.get("order") ?? ""}
              placeholder="KP-2026-00001-A1B2"
              className={`${inputClass} font-mono`}
            />
          </label>
          <label className="block text-sm">
            Email or Mobile Number *
            <input
              type="text"
              name="contact"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@example.com or 0917 000 0000"
              className={inputClass}
            />
          </label>

          {lookup && !lookup.ok && <p className="text-sm font-medium text-red-600">{lookup.error}</p>}

          <button
            type="submit"
            disabled={lookingUp}
            className="w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lookingUp ? "Looking up…" : "Track Order"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-forest/40 px-5 py-3 text-sm font-semibold text-forest transition hover:bg-ivory-deep"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const balance = balanceDue(order);

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <h1 className="font-serif text-3xl italic text-forest-dark">Track Your Order</h1>

      {/* Refresh-on-focus only — never rendered visibly. Keeps a live
          formRef mounted while the detail view (not the lookup form) is
          showing, so the window "focus" effect above has something to
          submit against. */}
      <form ref={refreshFormRef} action={lookupAction} hidden>
        <input type="hidden" name="orderNumber" value={order.orderNumber} />
        <input type="hidden" name="contact" value={contact} />
      </form>

      <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
        <p className="font-mono text-sm font-semibold text-forest-dark">{order.orderNumber}</p>
        <p className="mt-1 text-xs text-gray-500">Placed {new Date(order.createdAt).toLocaleString()}</p>
        <div className="mt-4 border-t border-gold-light/40 pt-4">
          <OrderStatusTimeline status={order.status} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06),0_24px_48px_-30px_rgba(27,58,46,0.15)]">

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{order.quantityLabel ? "Order" : "Pax"}</dt>
            <dd className="font-medium text-gray-900">{order.quantityLabel ?? order.pax}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Package</dt>
            <dd className="text-right font-medium text-gray-900">
              {order.packageName}
              {order.menuName ? ` · ${order.menuName}` : ""}
            </dd>
          </div>
          {order.eventType && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Event</dt>
              <dd className="text-right font-medium text-gray-900">
                {order.eventType}
                {order.eventDate ? ` on ${order.eventDate}` : ""}
                {order.eventTime ? ` at ${order.eventTime}` : ""}
              </dd>
            </div>
          )}
          {order.venue && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Venue</dt>
              <dd className="text-right font-medium text-gray-900">{order.venue}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">{order.deliveryMethod === "delivery" ? "Delivery Address" : "Method"}</dt>
            <dd className="text-right font-medium text-gray-900 capitalize">
              {order.deliveryMethod === "delivery" ? order.address : "Pickup"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-1 border-t border-gold-light/40 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>₱{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Fee</span>
            <span>₱{order.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gold-light/40 pt-2 text-base font-bold">
            <span className="text-forest-dark">Total</span>
            <span className="font-serif text-lg text-forest">₱{order.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-gold-light/40 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Payment Status</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                PAYMENT_STATUS_STYLES[order.paymentStatus] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reservation Deposit</span>
            <span>₱{order.depositAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-forest-dark">₱{order.amountPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-gray-700">Balance Due</span>
            <span>₱{balance.toLocaleString()}</span>
          </div>
        </div>

        {order.payments.length > 0 && (
          <div className="mt-4 border-t border-gold-light/40 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment History</p>
            <ul className="mt-2 space-y-2 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {p.kind} · {p.method} · {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">₱{p.amount.toLocaleString()}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === "Verified"
                          ? "bg-forest/10 text-forest-dark"
                          : p.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-gold-light/40 text-gold-dark"
                      }`}
                    >
                      {p.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {balance > 0 && (
        <PaymentSection order={order} contact={contact} onSubmitted={setPaidOrder} onDirtyChange={setPaymentFormDirty} />
      )}

      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
      >
        Back to Home
      </Link>
    </div>
  );
}
