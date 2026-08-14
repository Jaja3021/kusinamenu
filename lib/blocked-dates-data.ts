"use server";

// Read-only mirror of the admin dashboard's public.blocked_dates
// (herbies-dashboard/supabase/blocked_dates.sql) — dates the kitchen isn't
// accepting bookings for, with a reason. That table's "Public read blocked
// dates" RLS policy was written specifically so this repo could read it
// without any write access; nothing here ever inserts/updates/deletes it.

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlockedDate = {
  date: string; // YYYY-MM-DD
  reason: string;
  branch: string | null; // null = blocks every branch
};

type BlockedDateRow = {
  date: string;
  reason: string;
  branch: string | null;
};

function rowToBlockedDate(row: BlockedDateRow): BlockedDate {
  return { date: row.date, reason: row.reason, branch: row.branch };
}

// "Today" in Asia/Manila, not server-local — Vercel runs UTC, and every date
// this app writes (next_order_number(), supabase/payments.sql §1) is already
// pinned to Manila. Anything before this is unreachable from the date picker
// anyway (the 3-day lead time in app/order/confirm/page.tsx starts later
// still), so there's no need to fetch it.
function todayManilaISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export async function getBlockedDates(): Promise<BlockedDate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blocked_dates")
    .select("date, reason, branch")
    .gte("date", todayManilaISO())
    .order("date", { ascending: true });
  if (error) throw new Error(`Failed to load blocked dates: ${error.message}`);
  return (data as BlockedDateRow[]).map(rowToBlockedDate);
}
