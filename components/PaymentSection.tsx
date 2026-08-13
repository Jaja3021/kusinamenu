"use client";

import { useActionState, useState } from "react";
import { submitPaymentAction, type TrackResult } from "@/app/order/track/actions";
import { PAYMENT_METHODS, amountDueNow, type PaymentMethod, type TrackedOrder } from "@/lib/payments";
import { GCASH, BANK, PAYMENT_INSTRUCTIONS } from "@/lib/payment-config";
import { DummyQr } from "@/components/DummyQr";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // matches the bucket's file_size_limit (supabase/payments.sql §12)

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

type Props = {
  order: TrackedOrder;
  contact: string;
  onSubmitted: (order: TrackedOrder) => void;
};

export function PaymentSection({ order, contact, onSubmitted }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("GCash");
  const [fileError, setFileError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<TrackResult | null, FormData>(
    async (prev, formData) => {
      const result = await submitPaymentAction(prev, formData);
      if (result.ok) onSubmitted(result.order);
      return result;
    },
    null
  );

  const suggestedAmount = amountDueNow(order);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_PROOF_BYTES) {
      setFileError("That screenshot is too large — please attach one under 5 MB.");
      e.target.value = "";
    } else {
      setFileError(null);
    }
  }

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
            min={1}
            step="1"
            defaultValue={suggestedAmount}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-gray-500">
            Suggested: ₱{suggestedAmount.toLocaleString()} {order.amountPaid < order.depositAmount ? "(reservation deposit)" : "(remaining balance)"}
          </span>
        </label>

        {method !== "Cash" && (
          <>
            <label className="block text-sm">
              Reference Number *
              <input type="text" name="reference" required className={inputClass} placeholder="e.g. 0123456789012" />
            </label>
            <label className="block text-sm">
              Payment Screenshot *
              <input
                type="file"
                name="proof"
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
          disabled={pending || !!fileError}
          className="w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {pending ? "Submitting…" : method === "Cash" ? "Log Cash Payment" : "I've Sent It"}
        </button>
      </form>
    </div>
  );
}
