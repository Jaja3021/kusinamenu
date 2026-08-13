import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getPaymentQueue, getProofSignedUrl } from "@/lib/payments-data";
import { verifyPaymentAction, rejectPaymentAction } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-gold-light/40 text-gold-dark",
  Verified: "bg-forest/10 text-forest-dark",
  Rejected: "bg-red-100 text-red-700",
};

export default async function DashboardPaymentsPage() {
  await requireAdmin();
  const payments = await getPaymentQueue();
  const pendingCount = payments.filter((p) => p.status === "Submitted").length;

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl italic text-forest-dark">Payments</h1>
        <p className="mt-1 text-sm text-gray-600">
          {pendingCount > 0
            ? `${pendingCount} payment${pendingCount === 1 ? "" : "s"} waiting for verification.`
            : "All submitted payments have been reviewed."}
        </p>
      </div>

      {payments.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-gold-light/60 p-8 text-center text-sm text-gray-500">
          No payment submissions yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gold-light/40 bg-white shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-gold-light/40 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {await Promise.all(
                payments.map(async (p) => {
                  const proofUrl = p.proofPath ? await getProofSignedUrl(p.proofPath, 300) : null;
                  return (
                    <tr key={p.id} className="border-b border-gold-light/20 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/orders/${p.orderId}`}
                          className="font-mono text-xs text-forest hover:underline"
                        >
                          {p.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.kind} · {p.method}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">₱{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{p.referenceNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-forest hover:underline"
                          >
                            View ↗
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status === "Submitted" && (
                          <div className="flex justify-end gap-1">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
