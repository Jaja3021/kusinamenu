"use client";

import { useMemo, useState } from "react";
import type { BlockedDate } from "@/lib/blocked-dates-data";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Sun-start 6-row grid, matching herbies-dashboard's BookingsCalendar
// (components/dashboard/BookingsCalendar.tsx) approach — walk a cursor from
// the Sunday on/before the 1st, in weeks, until the month is covered.
// Styling and the early-break heuristic there are dashboard-specific and are
// not reused; only the walking logic is.
function buildMonthGrid(monthStart: Date): Date[] {
  const firstOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  // 6 rows always: keeps the grid height stable as the customer pages
  // between months instead of jumping around.
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

type DayState = { blocked: BlockedDate | null; tooSoon: boolean };

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (date: string) => void;
  minDate: string; // YYYY-MM-DD, the existing 3-day lead time
  blockedDates: BlockedDate[];
  branch: string; // "" | "cavite" | "laguna" | "metro-manila"
  loading?: boolean;
};

// Replaces a native <input type="date">, which offers no way to disable
// individual days or attach a reason to one — both required to show the
// admin dashboard's blocked_dates (public.blocked_dates, shared Supabase
// project) as unavailable instead of silently bookable.
export function EventDatePicker({ value, onChange, minDate, blockedDates, branch, loading }: Props) {
  const [monthCursor, setMonthCursor] = useState(() => parseISODate(value || minDate));
  // Tracks which day's reason is currently shown below the grid — driven by
  // hover AND focus AND tap, so the reason isn't hover-only (it has to work
  // on touch, where there's no hover).
  const [noteDate, setNoteDate] = useState<string | null>(null);

  const minMonthKey = useMemo(() => {
    const d = parseISODate(minDate);
    return d.getFullYear() * 12 + d.getMonth();
  }, [minDate]);
  const cursorMonthKey = monthCursor.getFullYear() * 12 + monthCursor.getMonth();

  const days = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  function dayState(dateISO: string): DayState {
    const tooSoon = dateISO < minDate;
    const blocked =
      blockedDates.find((b) => b.date === dateISO && (b.branch === null || b.branch === branch)) ?? null;
    return { blocked, tooSoon };
  }

  function goToMonth(offset: number) {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const noteState = noteDate ? dayState(noteDate) : null;
  const noteText = noteState?.blocked
    ? `${parseISODate(noteDate!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — unavailable: ${noteState.blocked.reason}`
    : "";

  return (
    <div className="mt-1 rounded-xl border border-gold-light/50 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          disabled={cursorMonthKey <= minMonthKey}
          aria-label="Previous month"
          className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-ivory-deep hover:text-forest-dark disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-forest-dark">{monthLabel}</p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-ivory-deep hover:text-forest-dark"
        >
          ›
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dateISO = toISODate(date);
          const inMonth = date.getMonth() === monthCursor.getMonth();
          const { blocked, tooSoon } = dayState(dateISO);
          const unselectable = tooSoon || !!blocked;
          const selected = dateISO === value;
          const longLabel = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const ariaLabel = blocked
            ? `${longLabel} — unavailable: ${blocked.reason}`
            : tooSoon
            ? `${longLabel} — too soon, minimum ${minDate}`
            : longLabel;

          return (
            <button
              key={dateISO}
              type="button"
              aria-disabled={unselectable || undefined}
              aria-pressed={selected}
              aria-label={ariaLabel}
              title={blocked ? blocked.reason : undefined}
              tabIndex={inMonth ? 0 : -1}
              onMouseEnter={() => setNoteDate(dateISO)}
              onMouseLeave={() => setNoteDate((prev) => (prev === dateISO ? null : prev))}
              onFocus={() => setNoteDate(dateISO)}
              onBlur={() => setNoteDate((prev) => (prev === dateISO ? null : prev))}
              onClick={() => {
                // Leading/trailing days from adjacent months are inert —
                // clicking one shouldn't silently jump the selection to a
                // month the customer isn't looking at. Blocked/too-soon days
                // still take focus (for the reason to be reachable by
                // keyboard) but never select.
                if (inMonth && !unselectable) onChange(dateISO);
              }}
              className={[
                "flex h-9 w-full items-center justify-center rounded-lg text-sm transition",
                !inMonth && "text-gray-300",
                selected && blocked && "bg-forest text-white ring-2 ring-red-500 ring-offset-1",
                selected && !blocked && "bg-forest font-semibold text-white shadow-sm",
                !selected && blocked && inMonth && "cursor-not-allowed bg-gray-100 text-gray-400 line-through",
                !selected && tooSoon && !blocked && inMonth && "cursor-not-allowed bg-ivory-deep/40 text-gray-300",
                !selected && !unselectable && inMonth && "cursor-pointer text-gray-700 hover:bg-ivory-deep",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Live region so the reason reaches screen readers, not just sighted
          hover/focus users. Reserves a line's height even when empty so the
          form doesn't jump as the customer explores the grid. */}
      <p aria-live="polite" className="mt-2 min-h-[1.1rem] text-xs font-medium text-red-600">
        {noteText}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-gold-light/30 pt-2 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-forest" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ivory-deep" /> Too soon
        </span>
      </div>

      {loading && <p className="mt-2 text-[11px] text-gray-400">Checking availability…</p>}
    </div>
  );
}
