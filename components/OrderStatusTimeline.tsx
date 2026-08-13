import type { OrderStatus } from "@/lib/orders";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "Pending Confirmation", label: "Order Received" },
  { status: "Confirmed", label: "Confirmed" },
  { status: "Preparing", label: "Preparing" },
  { status: "Cooking", label: "Cooking" },
  { status: "Ready for Delivery", label: "Ready / For Delivery" },
  { status: "Completed", label: "Completed" },
];

// Position of each real status within the 6-step happy path, so any status
// (including ones the customer's order isn't at yet) can be compared against
// the order's current status to decide done/active/upcoming.
const STEP_INDEX: Record<OrderStatus, number> = {
  "Pending Confirmation": 0,
  Confirmed: 1,
  Preparing: 2,
  Cooking: 3,
  "Ready for Delivery": 4,
  Completed: 5,
  Cancelled: -1, // handled separately below, never matched against STEPS
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = STEP_INDEX[status];

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const last = i === STEPS.length - 1;
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-forest text-white"
                    : active
                    ? "bg-gold text-forest-dark ring-4 ring-gold-light/50"
                    : "border-2 border-gray-200 bg-white text-gray-300"
                }`}
              >
                {done ? "✓" : active ? "●" : "○"}
              </span>
              {!last && <span className={`w-0.5 flex-1 ${done ? "bg-forest" : "bg-gray-200"}`} style={{ minHeight: "1.5rem" }} />}
            </div>
            <p className={`pb-6 text-sm ${active ? "font-semibold text-forest-dark" : done ? "text-gray-700" : "text-gray-400"}`}>
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
