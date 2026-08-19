import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The safety desk's queue.
 *
 * An open panic alert is the only thing in this console where the subject is
 * a person rather than a transaction, and the only one where being slow has
 * a cost that is not money. Everything here is arranged around one decision:
 * is this person safe, and can this Hustle be released back to normal?
 *
 * ── Clearing is not a tidy-up ─────────────────────────────────────
 *
 * While an alert is open the whole booking is frozen — no release, no
 * completion, no decline, for either party. Clearing it unfreezes all of
 * that, so it is not an inbox action to be done to make a list shorter. The
 * RPC behind it demands a note for that reason, and the note should say who
 * was spoken to and how they were identified.
 *
 * The emergency contact is on the row precisely so that conversation can
 * happen without leaving this page. Ring them, not the other party: on a
 * platform that sends strangers to meet each other, the other party is the
 * single most likely reason for the alarm.
 */

export type PanicDeskAlert = {
  id: string;
  conversation_id: string;
  profile_id: string;
  full_name: string | null;
  lat: number | null;
  lng: number | null;
  activated_at: string;
  cleared_at: string | null;
  cleared_by: "user" | "desk" | null;
  cleared_note: string | null;
  /** Null with no `notify_error` means the mail is still in flight. Null
   * WITH one means nobody was told and the reason is on the row. */
  notified_at: string | null;
  notify_error: string | null;
  title: string | null;
  venue_label: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
};

export type HoldAppealRow = {
  id: string;
  conversation_id: string;
  appellant_id: string;
  appellant_name: string | null;
  ground: string;
  detail: string;
  status: "pending" | "upheld" | "rejected";
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
  alert_id: string | null;
  activated_at: string | null;
  activator_id: string | null;
  activator_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
};

/** Neutral in the app, named plainly here. The desk knows what a hold is. */
export const HOLD_GROUND_LABELS: Record<string, string> = {
  work_complete: "Work was finished as agreed",
  no_concern: "Nothing happened that needs reviewing",
  wrong_session: "Wrong booking",
  urgent: "The hold is causing hardship",
};

/** What each claim actually obliges you to check before deciding. */
export const HOLD_GROUND_TESTS: Record<string, string> = {
  work_complete:
    "Does the chat and the money trail show the work delivered? Note that a completed job does not make an alarm false — someone can finish a Hustle and still be in trouble.",
  no_concern:
    "The appellant cannot see the alert, so this is a claim about their own conduct, not about the alarm. Weigh it as one.",
  wrong_session:
    "Check the conversation id on both rows. A genuine mismatch means the activator pressed on the wrong chat and the alert should be cleared regardless of this appeal.",
  urgent:
    "Real hardship is a reason to decide quickly, never a reason to clear an alert you have not confirmed. Speed the review, not the conclusion.",
};

/** Open incidents first, newest first within that. */
export async function listPanicAlerts(): Promise<PanicDeskAlert[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_panic_alerts")
    .select("*")
    .order("cleared_at", { ascending: true, nullsFirst: true })
    .order("activated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`console_panic_alerts: ${error.message}`);
  return (data ?? []) as PanicDeskAlert[];
}

export async function listHoldAppeals(): Promise<HoldAppealRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_hold_appeals")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`console_hold_appeals: ${error.message}`);
  return (data ?? []) as HoldAppealRow[];
}

/** A map link for the position captured at the moment of the press. */
export function mapLink(alert: PanicDeskAlert): string | null {
  if (alert.lat == null || alert.lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`;
}
