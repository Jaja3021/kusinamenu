"use client";

import { useEffect, useState } from "react";

type OtpModalProps = {
  open: boolean;
  email: string;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-center text-lg tracking-[0.5em] text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

// Parent mounts this with key={open ? "open" : "closed"} — that's what
// gives each newly-opened modal fresh `code`/`cooldown` state, instead of
// resetting them from an effect (which reads as one render behind `open`).
export function OtpModal({ open, email, sending, verifying, error, onVerify, onResend, onClose }: OtpModalProps) {
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, cooldown]);

  if (!open) return null;

  function handleResend() {
    onResend();
    setCooldown(60);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-dark/60 px-4 py-8" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gold-light/40 px-6 py-4">
          <h2 className="font-serif text-xl italic text-forest-dark">Verify Your Email</h2>
          <p className="mt-1 text-xs text-gray-500">
            {sending ? "Sending a code to " : "We sent a 6-digit code to "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm">
            Verification Code
            <input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={inputClass}
            />
          </label>

          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="button"
            disabled={code.length !== 6 || verifying || sending}
            onClick={() => onVerify(code)}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {verifying ? "Verifying…" : "Verify & Send Inquiry"}
          </button>

          <button
            type="button"
            disabled={cooldown > 0 || sending}
            onClick={handleResend}
            className="mt-3 w-full text-center text-xs font-medium text-forest hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <div className="flex items-center justify-end border-t border-gold-light/40 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 hover:bg-ivory-deep"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
