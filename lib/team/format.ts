/**
 * Display helpers for the ledger. Pure, so both the dashboard and the
 * console review render a name, a date and an hour count identically.
 */

import { formatPhone } from "@/lib/team/phone";

/**
 * The ledger's clock.
 *
 * Everyone writing these entries is in Nigeria, and the server is not.
 * Without a fixed zone, "today" is UTC's today — so someone writing up
 * their evening at half past midnight in Lagos would find the date picker
 * refusing the day they are actually living in, and the action rejecting
 * it as being in the future. One constant, used by the form and the check
 * that guards it, so the two can't drift apart.
 */
export const LEDGER_TIMEZONE = "Africa/Lagos";

/** Today where the work is happening, as `YYYY-MM-DD`. */
export function ledgerToday(): string {
  // en-CA is the locale whose short date format is already ISO order.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LEDGER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** A calendar day — `occurred_on` is a date, with no time and no timezone,
 * so it is formatted from its parts rather than through `new Date()`,
 * which would shift it a day for anyone west of UTC. */
export function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * How a member is named on screen, anywhere.
 *
 * A roster entry has no name until its owner signs up and gives one, so
 * everything that displays a member has to answer "and if there isn't
 * one?". Answering it in one place means no screen quietly renders "null"
 * or an empty gap, and the fallback is the phone number — the only thing
 * actually known about a row nobody has claimed yet.
 */
export function memberLabel(member: {
  name: string | null;
  phone: string;
}): string {
  return member.name?.trim() || formatPhone(member.phone);
}

/** "3h", "3.5h", "—". Trailing zeros dropped: nobody writes 3.00 hours. */
export function formatHours(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}h`;
}
