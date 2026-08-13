// Money constants shared by client components (WizardContext) and server
// code (app/order/confirm/actions.ts). Plain module — no "use server", no
// I/O — so it can be imported from either side without restriction.

export const DELIVERY_FEE = 500;

// Reservation deposit required to lock an event date; the remainder is due
// on or before the day of service (see components/TermsModal.tsx). Stored
// per-order as orders.deposit_amount at placement time, so a later change
// here never moves an already-placed order's deposit.
export const DEPOSIT_PERCENT = 0.5;

export function depositFor(total: number): number {
  return Math.round(total * DEPOSIT_PERCENT);
}
