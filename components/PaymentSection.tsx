"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitPaymentAction, type TrackResult } from "@/app/order/track/actions";
import { PAYMENT_METHODS, amountDueNow, balanceDue, type PaymentMethod, type TrackedOrder } from "@/lib/payments";
import { GCASH, BANK, PAYMENT_INSTRUCTIONS } from "@/lib/payment-config";
import { DummyQr } from "@/components/DummyQr";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // matches the bucket's file_size_limit (supabase/payments.sql §12)

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

type Props = {
  order: TrackedOrder;
  contact: string;
  onSubmitted: (order: TrackedOrder) => void;
  // Lets the parent (TrackOrderClient) know this form has unsaved input, so
  // it can hold off its own window-focus refresh. Opening the file picker
  // blurs the window; without this, refocusing after picking a screenshot
  // fired a background lookup that swapped `order` out from under the still-
  // open form.
  onDirtyChange?: (dirty: boolean) => void;
};

export function PaymentSection({ order, contact, onSubmitted, onDirtyChange }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("GCash");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<TrackResult | null, FormData>(
    async (prev, formData) => {
      const result = await submitPaymentAction(prev, formData);
      if (result.ok) {
        onSubmitted(result.order);
        // Cleared here (not in an effect keyed on `state`) because these are
        // plain React state — there's no DOM-reset timing to wait for, unlike
        // the file input restoration below.
        setReference("");
        setProofFile(null);
        setFileError(null);
      }
      return result;
    },
    null
  );

  const suggestedAmount = amountDueNow(order);
  // The deposit must be paid in full before anything else counts — once it's
  // covered, the floor drops to 1 so partial balance payments stay allowed
  // (mirrors the Deposit/Balance kind split in begin_payment, supabase/
  // payments.sql §10).
  const depositOutstanding = order.amountPaid < order.depositAmount;
  const minAmount = depositOutstanding ? order.depositAmount - order.amountPaid : 1;
  const maxAmount = balanceDue(order);
  const [amount, setAmount] = useState(suggestedAmount);
  const amountInvalid = amount < minAmount || amount > maxAmount;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_PROOF_BYTES) {
      setFileError("That screenshot is too large — please attach one under 5 MB.");
      e.target.value = "";
      setProofFile(null);
    } else {
      setFileError(null);
      setProofFile(file ?? null);
    }
  }

  // <form action={...}> resets uncontrolled fields once the action dispatch
  // completes — including on a FAILED submission, which used to wipe the
  // Reference Number and the chosen screenshot at exactly the moment the
  // customer needed to read the error and retry. Reference Number is now a
  // controlled input (below), so it survives on its own; a file input can
  // never be controlled by React, so its selection is restored here via
  // DataTransfer — this has to run in an effect (not the action callback
  // above) because it must happen AFTER the platform's own reset, which
  // isn't observable until `state` changes and this effect re-runs.
  useEffect(() => {
    if (!state || state.ok) return;
    const input = fileInputRef.current;
    if (!input || !proofFile || (input.files && input.files.length > 0)) return;
    const transfer = new DataTransfer();
    transfer.items.add(proofFile);
    input.files = transfer.files;
  }, [state, proofFile]);

  useEffect(() => {
    onDirtyChange?.(pending || reference.trim() !== "" || proofFile !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDirtyChange is a setState setter, stable by identity
  }, [pending, reference, proofFile]);

  return (
    <div className="mt-6 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
      <h2 className="font-serif text-lg italic text-forest-dark">Make a Payment</h2>

      <div className="mt-4 flex gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              method === m
                ? "bg-gradient-to-r from-forest to-forest-light text-white shadow-sm"
                : "border border-gold-light/50 text-gray-600 hover:bg-ivory-deep"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-600">{PAYMENT_INSTRUCTIONS[method]}</p>

      {(method === "GCash" || method === "Bank Transfer") && (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-gold-light/40 bg-ivory-deep/40 p-4 sm:flex-row sm:items-start">
          <DummyQr className="h-36 w-36 flex-shrink-0" />
          <dl className="space-y-1 text-sm">
            {method === "GCash" ? (
              <>
                <div>
                  <dt className="inline text-gray-500">Account Name: </dt>
                  <dd className="inline font-medium text-gray-900">{GCASH.accountName}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">GCash Number: </dt>
                  <dd className="inline font-mono font-medium text-gray-900">{GCASH.accountNumber}</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="inline text-gray-500">Bank: </dt>
                  <dd className="inline font-medium text-gray-900">{BANK.bankName}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Account Name: </dt>
                  <dd className="inline font-medium text-gray-900">{BANK.accountName}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Account Number: </dt>
                  <dd className="inline font-mono font-medium text-gray-900">{BANK.accountNumber}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Branch: </dt>
                  <dd className="inline font-medium text-gray-900">{BANK.branch}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      )}

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="orderNumber" value={order.orderNumber} />
        <input type="hidden" name="contact" value={contact} />
        <input type="hidden" name="method" value={method} />

        <label className="block text-sm">
          Amount *
          <input
            type="number"
            name="amount"
            min={minAmount}
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className={`${inputClass} no-spinner`}
          />
          <span className="mt-1 block text-xs text-gray-500">
            {depositOutstanding
              ? `50% downpayment — ₱${minAmount.toLocaleString()} of ₱${order.total.toLocaleString()} total. This is the minimum for this payment.`
              : `Remaining balance: ₱${maxAmount.toLocaleString()}`}
          </span>
          {amountInvalid && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {amount < minAmount
                ? `Enter at least ₱${minAmount.toLocaleString()}.`
                : `Amount can't exceed the balance of ₱${maxAmount.toLocaleString()}.`}
            </span>
          )}
        </label>

        {method !== "Cash" && (
          <>
            <label className="block text-sm">
              Reference Number *
              <input
                type="text"
                name="reference"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClass}
                placeholder="e.g. 0123456789012"
              />
            </label>
            <label className="block text-sm">
              Payment Screenshot *
              <input
                type="file"
                name="proof"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/heic"
                required
                onChange={handleFileChange}
                className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-ivory-deep file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest-dark`}
              />
              {fileError && <span className="mt-1 block text-xs font-medium text-red-600">{fileError}</span>}
            </label>
          </>
        )}

        {state && !state.ok && <p className="text-sm font-medium text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || !!fileError || amountInvalid}
          className="w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {pending ? "Submitting…" : method === "Cash" ? "Log Cash Payment" : "I've Sent It"}
        </button>
      </form>
    </div>
  );
}
