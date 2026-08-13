import { getPaymentsForOrder, getProofSignedUrl } from "@/lib/payments-data";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/dashboard/payments/actions";

const STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-gold-light/40 text-gold-dark",
  Verified: "bg-forest/10 text-forest-dark",
  Rejected: "bg-red-100 text-red-700",
};

// Server component — reused on the order detail page (app/dashboard/
// orders/[id]/page.tsx). Fetches its own data so callers only need to pass
// an orderId, matching the pattern PackagesPanel-style dashboard sections
// already use.
export async function PaymentsPanel({ orderId }: { orderId: string }) {
  const payments = (await getPaymentsForOrder(orderId)).filter((p) => p.status !== "Pending Upload");

  return (
    <section className="rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:col-span-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Payments</h2>

      {payments.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No payments submitted yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gold-light/20">
          {await Promise.all(
            payments.map(async (p) => {
              const proofUrl = p.proofPath ? await getProofSignedUrl(p.proofPath, 300) : null;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.kind} · {p.method} · ₱{p.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.referenceNumber ? `Ref: ${p.referenceNumber} · ` : ""}
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                    {p.adminNote && <p className="mt-1 text-xs text-gray-500">Note: {p.adminNote}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {proofUrl && (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-forest hover:underline"
                      >
                        View Proof ↗
                      </a>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.status === "Submitted" && (
                      <div className="flex items-center gap-1">
                        <form action={verifyPaymentAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                          >
                            Verify
                          </button>
                        </form>
                        <form action={rejectPaymentAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </section>
  );
}
