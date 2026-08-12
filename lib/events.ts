import type { PackageCategory } from "@/lib/packages";

export type EventTypeInfo = {
  slug: string;
  /** Heading shown once the event is picked, e.g. "Wedding Package". */
  name: string;
  /** Short label stored as ScheduleInfo.eventType and shown in order records. */
  shortLabel: string;
  description: string;
  categories: PackageCategory[];
};

const NON_TRAY_CATEGORIES: PackageCategory[] = ["Grazing", "Full-Service Catering"];

// Single source of truth for the homepage event picker AND the confirm
// step's read-only "Event Type" display — previously these were two
// separate, mismatched lists (see app/order/confirm/page.tsx history).
export const EVENT_TYPES: EventTypeInfo[] = [
  {
    slug: "wedding",
    name: "Wedding Package",
    shortLabel: "Wedding",
    description: "Celebrate your special day with a beautifully curated menu and flawless service made for love.",
    categories: NON_TRAY_CATEGORIES,
  },
  {
    slug: "kids-party",
    name: "Kids Party Package",
    shortLabel: "Kids Party",
    description: "Fun, tasty, and kid-approved menus that make every birthday and celebration extra special!",
    categories: NON_TRAY_CATEGORIES,
  },
  {
    slug: "debut",
    name: "Debut Package",
    shortLabel: "Debut",
    description: "Mark her milestone with elegant food, timeless style, and unforgettable memories.",
    categories: NON_TRAY_CATEGORIES,
  },
  {
    slug: "corporate",
    name: "Corporate Event",
    shortLabel: "Corporate",
    description: "Professional service and satisfying meals for meetings, conferences, and company events.",
    categories: NON_TRAY_CATEGORIES,
  },
  {
    slug: "private",
    name: "Private Event",
    shortLabel: "Private Event",
    description: "From intimate gatherings to special celebrations, we bring flavor to your important moments.",
    categories: NON_TRAY_CATEGORIES,
  },
  {
    slug: "tray-orders",
    name: "Tray Orders",
    shortLabel: "Tray Order",
    description: "Party trays and packed meals for any occasion — mix, match, and pay by the tray.",
    categories: ["Tray Orders"],
  },
];

export function getEventType(slug: string | null | undefined): EventTypeInfo | undefined {
  return EVENT_TYPES.find((e) => e.slug === slug);
}

export function getEventShortLabel(slug: string | null | undefined): string {
  return getEventType(slug)?.shortLabel ?? "Not specified";
}
