import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getOrders } from "@/lib/orders-data";
import type { OrderStatus } from "@/lib/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  "Pending Confirmation": "bg-gold-light/40 text-gold-dark",
  Confirmed: "bg-forest/10 text-forest-dark",
  Preparing: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default async function DashboardOrdersPage() {
  await requireAdmin();
  const orders = await getOrders();

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl italic text-forest-dark">Orders</h1>
        <p className="mt-1 text-sm text-gray-600">Incoming inquiries from the storefront.</p>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-gold-light/60 p-8 text-center text-sm text-gray-500">
          No orders yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gold-light/40 bg-white shadow-[0_1px_3px_rgba(27,58,46,0.06)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gold-light/40 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gold-light/20 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {order.firstName} {order.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.packageName}</td>
                  <td className="px-4 py-3 text-gray-600">{order.eventDate ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">₱{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-forest hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
