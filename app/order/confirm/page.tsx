"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stepper, FIXED_MENU_STEPS } from "@/components/Stepper";
import { BackButton } from "@/components/BackButton";
import { TermsModal } from "@/components/TermsModal";
import { OtpModal } from "@/components/OtpModal";
import { EventDatePicker } from "@/components/EventDatePicker";
import { getBlockedDates, type BlockedDate } from "@/lib/blocked-dates-data";
import {
  useWizard,
  type CustomerInfo,
  type ScheduleInfo,
} from "@/context/WizardContext";
import { usePackages } from "@/context/PackagesContext";
import { useMyOrders } from "@/context/MyOrdersContext";
import { getEventShortLabel } from "@/lib/events";
import { sendOrderOtp, verifyOtpAndPlaceOrder } from "./actions";
import {
  isTrayCartPackage,
  isPackedMealPackage,
  isFixedMenuPackage,
} from "@/lib/packages";

const BRANCHES = [
  { id: "cavite", name: "Cavite", area: "Serving Cavite and nearby areas" },
  { id: "laguna", name: "Laguna", area: "Serving Laguna and nearby areas" },
  { id: "metro-manila", name: "Metro Manila", area: "Serving Metro Manila and nearby areas" },
];

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ConfirmPage() {
  const router = useRouter();
  const { draft, placeOrder, setPax } = useWizard();
  const { addOrder } = useMyOrders();
  const { getPackage, resolveMenu, getPaxLabel, loading: packagesLoading } = usePackages();
  const pkg = draft.packageSlug ? getPackage(draft.packageSlug) : undefined;
  const menu = draft.packageSlug
    ? resolveMenu(draft.packageSlug, draft.pax, draft.menuId, draft.cart, draft.selectedDishes, draft.packedMealCart)
    : undefined;

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return toDateInputValue(d);
  }, []);

  // Fetched once on mount, not gated behind the pkg/menu early-returns below
  // (this hook has to stay above every conditional return in the component).
  // A failed fetch degrades to "nothing blocked" rather than making the form
  // unusable — the server-side guard in actions.ts is what's actually
  // authoritative, this is just so the picker doesn't need to be perfect.
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getBlockedDates()
      .then((rows) => {
        if (!cancelled) setBlockedDates(rows);
      })
      .catch((err) => {
        console.error("[ConfirmPage] getBlockedDates failed:", err);
      })
      .finally(() => {
        if (!cancelled) setBlockedDatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [schedule, setSchedule] = useState<ScheduleInfo>(draft.scheduleInfo);
  const [customer, setCustomer] = useState<CustomerInfo>(draft.customerInfo);
  const [delivery, setDelivery] = useState<"delivery" | "pickup">(draft.deliveryMethod);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const eventTypeLabel = getEventShortLabel(draft.eventTypeSlug);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (submitting || packagesLoading) return;
    if (!pkg || !menu) router.replace("/");
  }, [pkg, menu, router, submitting, packagesLoading]);

  if (submitting) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center text-gray-600">
        Placing your order…
      </div>
    );
  }

  if (packagesLoading) {
    return <div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center text-gray-500">Loading…</div>;
  }

  if (!pkg || !menu) return null;

  const isCart = isTrayCartPackage(pkg);
  const isPackedMeal = isPackedMealPackage(pkg);
  const fixedMenu = isFixedMenuPackage(pkg);
  const quantityLabel = isCart
    ? `${draft.cart.reduce((sum, line) => sum + line.qty, 0)} tray${
        draft.cart.reduce((sum, line) => sum + line.qty, 0) === 1 ? "" : "s"
      }`
    : isPackedMeal
    ? `${draft.packedMealCart.reduce((sum, line) => sum + line.qty, 0)} pcs`
    : `${getPaxLabel(pkg.slug, draft.pax ?? 0)} Pax`;

  // Re-derived on every render (not memoized) so a branch change after a
  // date was already picked is caught immediately: the date stays visibly
  // selected, but a branch-specific block for the newly chosen branch makes
  // it invalid without silently clearing what the customer picked.
  const activeBlock =
    schedule.date === ""
      ? undefined
      : blockedDates.find(
          (b) => b.date === schedule.date && (b.branch === null || b.branch === schedule.branch)
        );
  const dateIsValid = schedule.date !== "" && schedule.date >= minDate && !activeBlock;
  const selectedBranchName = BRANCHES.find((b) => b.id === schedule.branch)?.name;
  const formattedScheduleDate = schedule.date
    ? new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  const canSubmit =
    schedule.branch !== "" &&
    dateIsValid &&
    customer.firstName !== "" &&
    customer.lastName !== "" &&
    customer.phone !== "" &&
    customer.email !== "" &&
    (delivery === "pickup" || (customer.address !== "" && schedule.deliveryTime !== "")) &&
    agreedToTerms;

  async function handleSendInquiry() {
    if (!canSubmit || submitting) return;
    setOtpError(null);
    setOtpOpen(true);
    setOtpSending(true);
    const { error } = await sendOrderOtp(customer.email, schedule.date, schedule.branch);
    setOtpSending(false);
    if (error) setOtpError(error);
  }

  async function handleResendOtp() {
    setOtpError(null);
    setOtpSending(true);
    const { error } = await sendOrderOtp(customer.email, schedule.date, schedule.branch);
    setOtpSending(false);
    if (error) setOtpError(error);
  }

  async function handleVerifyOtp(code: string) {
    setOtpError(null);
    setOtpVerifying(true);
    const scheduleWithEventType = { ...schedule, eventType: eventTypeLabel };
    const response = await verifyOtpAndPlaceOrder(code, {
      packageSlug: draft.packageSlug!,
      pax: draft.pax,
      menuId: draft.menuId,
      cart: draft.cart,
      selectedDishes: draft.selectedDishes,
      packedMealCart: draft.packedMealCart,
      scheduleInfo: scheduleWithEventType,
      customerInfo: customer,
      deliveryMethod: delivery,
    });
    setOtpVerifying(false);
    if (!response.ok) {
      setOtpError(response.error);
      return;
    }
    setSubmitting(true);
    setOtpOpen(false);
    placeOrder(scheduleWithEventType, customer, delivery, response.result);
    // Remembers this order for the "My Orders" nav badge/list — the only
    // record of "which orders are mine" this app keeps, since there's no
    // customer login (see context/MyOrdersContext.tsx).
    addOrder(response.result.orderNumber, customer.email);
    router.push("/order/confirmation");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <Stepper current={fixedMenu ? 3 : 4} steps={fixedMenu ? FIXED_MENU_STEPS : undefined} />

      <h1 className="mt-8 font-serif text-3xl italic text-forest-dark">Where do we send it?</h1>
      <p className="mt-1 text-gray-600">We&apos;ll confirm your booking here. Fields marked * are required.</p>

      <div className="mt-6 rounded-2xl border border-gold-light/60 bg-gold-light/10 px-4 py-3 text-sm text-gold-dark">
        Please book at least 3 days before your event. We&apos;ll confirm within 1 business day.
      </div>

      <div className="mt-6 space-y-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06),0_24px_48px_-30px_rgba(27,58,46,0.15)]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold uppercase tracking-wide text-gold-dark">
          <span className="whitespace-nowrap">{pkg.name}</span>
          <span className="text-gold-light">·</span>
          <span className="whitespace-nowrap">{menu.name}</span>
          <span className="text-gold-light">·</span>
          <span className="whitespace-nowrap">{quantityLabel}</span>
          <span className="text-gold-light">·</span>
          <span className="whitespace-nowrap">₱{menu.price.toLocaleString()}</span>
        </div>

        <div className="border-t border-gold-light/40 pt-6">
          <p className="text-sm font-medium text-gray-700">Serving Branch *</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BRANCHES.map((branch) => (
              <label
                key={branch.id}
                className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition hover:bg-ivory-deep ${
                  schedule.branch === branch.id ? "border-forest bg-ivory-deep" : "border-gold-light/50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <input
                    type="radio"
                    name="branch"
                    checked={schedule.branch === branch.id}
                    onChange={() => setSchedule({ ...schedule, branch: branch.id })}
                    className="h-4 w-4 accent-forest"
                  />
                  {branch.name}
                </span>
                <span className="mt-1 text-xs text-gray-500">{branch.area}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gold-light/40 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Your Details</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              First Name *
              <input
                value={customer.firstName}
                onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                placeholder="First name"
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Last Name *
              <input
                value={customer.lastName}
                onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                placeholder="Last name"
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            Email Address *
            <input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              placeholder="your@example.com"
              className={inputClass}
            />
          </label>

          <label className="mt-4 block text-sm">
            Phone Number *
            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="+63 900 000 0000"
              className={inputClass}
            />
          </label>
        </div>

        <div className="border-t border-gold-light/40 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Event Schedule</h2>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-gold-light/50 bg-ivory-deep/40 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Event Type</p>
              <p className="text-sm font-semibold text-gray-900">{eventTypeLabel}</p>
            </div>
            <Link href="/" className="text-sm font-medium text-forest hover:underline">
              Change
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-sm">
              <p className="font-medium text-gray-700">Event Date *</p>
              <EventDatePicker
                value={schedule.date}
                onChange={(date) => setSchedule({ ...schedule, date })}
                minDate={minDate}
                blockedDates={blockedDates}
                branch={schedule.branch}
                loading={blockedDatesLoading}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Must be at least 3 days from today.
              </span>
              {schedule.date !== "" && !dateIsValid && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {activeBlock
                    ? `${formattedScheduleDate} is unavailable${
                        selectedBranchName ? ` for ${selectedBranchName}` : ""
                      } — ${activeBlock.reason}. Please pick another date.`
                    : `Please choose a date on or after ${minDate}.`}
                </span>
              )}
            </div>
            <label className="text-sm">
              Event Time <span className="text-xs font-normal text-gray-400">(Optional)</span>
              <select
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                className={inputClass}
              >
                <option value="">No specific time</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm">
            Venue <span className="text-xs font-normal text-gray-400">(Optional)</span>
            <input
              value={schedule.venue}
              onChange={(e) => setSchedule({ ...schedule, venue: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="border-t border-gold-light/40 pt-6">
          <p className="text-sm font-medium text-gray-700">How to Receive It</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition hover:bg-ivory-deep ${
                delivery === "delivery" ? "border-forest bg-ivory-deep" : "border-gold-light/50"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={delivery === "delivery"}
                  onChange={() => setDelivery("delivery")}
                  className="h-4 w-4 accent-forest"
                />
                Delivery
              </span>
              <span className="mt-1 text-xs text-gray-500">We help you deliver — you pay the fee</span>
            </label>
            <label
              className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition hover:bg-ivory-deep ${
                delivery === "pickup" ? "border-forest bg-ivory-deep" : "border-gold-light/50"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={delivery === "pickup"}
                  onChange={() => setDelivery("pickup")}
                  className="h-4 w-4 accent-forest"
                />
                Pickup
              </span>
              <span className="mt-1 text-xs text-gray-500">You collect, or send your own rider</span>
            </label>
          </div>

          {delivery === "delivery" && (
            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                Delivery Time * <span className="text-xs font-normal text-gray-400">(6 AM – 6 PM)</span>
                <select
                  value={schedule.deliveryTime}
                  onChange={(e) => setSchedule({ ...schedule, deliveryTime: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Delivery Address *
                <input
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Street, City, Province"
                  className={inputClass}
                />
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-gold-light/40 pt-6">
          <label className="block text-sm">
            Note / Event Details <span className="text-xs font-normal text-gray-400">(Optional)</span>
            <textarea
              value={schedule.instructions}
              onChange={(e) => setSchedule({ ...schedule, instructions: e.target.value })}
              rows={3}
              placeholder="Share your event date, venue, special requests, or anything else Kusinang Pamana should know."
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-start gap-2 border-t border-gold-light/40 pt-6 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onClick={(e) => {
              if (!agreedToTerms) {
                e.preventDefault();
                setShowTerms(true);
              }
            }}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-forest"
          />
          I have read and agree to Kusinang Pamana&apos;s Terms &amp; Conditions
        </label>
      </div>

      <TermsModal
        open={showTerms}
        onAgree={() => {
          setAgreedToTerms(true);
          setShowTerms(false);
        }}
        onClose={() => setShowTerms(false)}
      />

      <OtpModal
        key={otpOpen ? "open" : "closed"}
        open={otpOpen}
        email={customer.email}
        sending={otpSending}
        verifying={otpVerifying}
        error={otpError}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => setOtpOpen(false)}
      />

      <div className="mt-8 flex items-center justify-between gap-4">
        <BackButton
          onClick={() => {
            if (fixedMenu) {
              setPax(null);
              router.push("/order/build");
            } else {
              router.push("/order/review");
            }
          }}
          label={fixedMenu ? "Change pax" : "Back to review"}
        />
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSendInquiry}
          className="rounded-full bg-gradient-to-r from-forest to-forest-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Send Inquiry
        </button>
      </div>
    </div>
  );
}
