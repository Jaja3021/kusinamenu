import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getOrder } from "@/lib/orders-data";
import { ORDER_STATUSES } from "@/lib/orders";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { updateOrderStatusAction } from "../actions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/orders" className="text-sm font-medium text-forest hover:underline">
        ← Back to Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl italic text-forest-dark">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-600">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <form action={updateOrderStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={order.id} />
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-forest to-forest-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Update
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Package</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Package</dt>
              <dd className="font-medium text-gray-900">{order.packageName}</dd>
            </div>
            {order.menuName && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Menu</dt>
                <dd className="font-medium text-gray-900">{order.menuName}</dd>
              </div>
            )}
            {order.quantityLabel && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Quantity</dt>
                <dd className="font-medium text-gray-900">{order.quantityLabel}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gold-light/40 pt-2">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>₱{order.subtotal.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Delivery Fee</dt>
              <dd>₱{order.deliveryFee.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt className="text-forest-dark">Total</dt>
              <dd className="font-serif text-lg text-forest">₱{order.total.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-t border-gold-light/40 pt-2">
              <dt className="text-gray-500">Deposit</dt>
              <dd>₱{order.depositAmount.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount Paid</dt>
              <dd className="font-medium text-forest-dark">₱{order.amountPaid.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Payment Status</dt>
              <dd className="inline-flex items-center rounded-full bg-gold-light/40 px-2.5 py-1 text-xs font-semibold text-gold-dark">
                {order.paymentStatus}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">
                {order.firstName} {order.lastName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{order.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{order.phone}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)] sm:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gold-dark">Schedule &amp; Delivery</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Event Type</dt>
              <dd className="font-medium text-gray-900">{order.eventType ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Event Date</dt>
              <dd className="font-medium text-gray-900">
                {order.eventDate ?? "—"} {order.eventTime ?? ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Branch</dt>
              <dd className="font-medium text-gray-900">{order.branch ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Venue</dt>
              <dd className="font-medium text-gray-900">{order.venue || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Method</dt>
              <dd className="font-medium capitalize text-gray-900">{order.deliveryMethod}</dd>
            </div>
            {order.deliveryMethod === "delivery" && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery Time</dt>
                  <dd className="font-medium text-gray-900">{order.deliveryTime ?? "—"}</dd>
                </div>
                <div className="flex justify-between sm:col-span-2">
                  <dt className="text-gray-500">Address</dt>
                  <dd className="text-right font-medium text-gray-900">{order.address ?? "—"}</dd>
                </div>
              </>
            )}
            {order.instructions && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="mt-1 text-gray-900">{order.instructions}</dd>
              </div>
            )}
          </dl>
        </section>

        <PaymentsPanel orderId={order.id} />
      </div>
    </div>
  );
}
