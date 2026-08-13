import type { PaymentMethod } from "@/lib/payments";

// Payment instructions shown on /order/track. Plain repo config rather than
// an admin settings page or env vars: these render client-side, so an env
// var would need NEXT_PUBLIC_ anyway (zero secrecy benefit) and would just
// be a new "blank in prod" failure mode. A diff on this file shows exactly
// who changed the account number and when.

export const GCASH = {
  accountName: "Kusinang Pamana Catering",
  accountNumber: "0917 123 4567",
};

export const BANK = {
  bankName: "BPI",
  accountName: "Kusinang Pamana Catering Services",
  accountNumber: "1234 5678 90",
  branch: "Cavite",
};

export const PAYMENT_INSTRUCTIONS: Record<PaymentMethod, string> = {
  Cash: "Hand your payment to our team on delivery or pickup. We'll log it as received — no reference number needed.",
  GCash: "Send the amount to the GCash number below, then enter the reference number and upload a screenshot of the receipt.",
  "Bank Transfer": "Transfer the amount to the account below, then enter the reference number and upload a screenshot of the receipt.",
};
