type TermsModalProps = {
  open: boolean;
  onAgree: () => void;
  onClose: () => void;
};

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "1. Booking & Reservations",
    body: "A booking is confirmed only once Kusinang Pamana reviews your inquiry and sends written confirmation. We recommend booking at least 3 days before your event, though availability may allow for shorter notice.",
  },
  {
    heading: "2. Payment & Deposit",
    body: "A non-refundable reservation deposit is required to secure your event date. The remaining balance is due on or before the day of service, unless otherwise agreed in writing with our team.",
  },
  {
    heading: "3. Cancellations & Rescheduling",
    body: "Cancellations made less than 5 days before the event date may forfeit the deposit. Rescheduling is subject to availability and must be requested as early as possible.",
  },
  {
    heading: "4. Delivery, Pickup & Setup",
    body: "Delivery times are estimates and may vary due to traffic or weather. For pickup orders, food is the customer's responsibility once collected. Setup and pull-out timelines will be coordinated with our staff on the day of the event.",
  },
  {
    heading: "5. Menu Changes & Substitutions",
    body: "Menu items are based on seasonal availability. Kusinang Pamana reserves the right to substitute a dish with one of equal or greater value if an ingredient becomes unavailable, and will inform the customer when possible.",
  },
  {
    heading: "6. Food Handling & Allergies",
    body: "Please inform us of any allergies or dietary restrictions when booking. Once food has been served or handed over, Kusinang Pamana is not responsible for spoilage caused by improper storage or delayed consumption.",
  },
  {
    heading: "7. Liability",
    body: "Kusinang Pamana is not liable for damages, delays, or losses caused by circumstances beyond our reasonable control, including but not limited to weather, traffic, or venue access issues.",
  },
];

export function TermsModal({ open, onAgree, onClose }: TermsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-dark/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-gold-light/40 px-6 py-4">
          <h2 className="font-serif text-xl italic text-forest-dark">Terms &amp; Conditions</h2>
          <p className="mt-1 text-xs text-gray-500">Kusinang Pamana Catering</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 text-sm text-gray-600">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <p className="text-sm font-semibold text-forest-dark">{section.heading}</p>
                <p className="mt-1">{section.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gold-light/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 hover:bg-ivory-deep"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}
