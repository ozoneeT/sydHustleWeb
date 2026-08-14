import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * User reports — somebody in the app pressing "Report this".
 *
 * Not to be confused with Moderation, which is the *automatic* filter's
 * log: `moderation_queue` records text that tripped `moderate_public_text`
 * on its way in. This queue is the human one. Nothing here was caught by
 * a rule; every row is a person saying something is wrong.
 *
 * That difference decides how the two should be read. A moderation row
 * has already been acted on by the time you see it — the message was
 * blocked, flagged or removed. A report has had nothing happen to it at
 * all: the content is live in the app right now, and stays live until
 * somebody here decides otherwise.
 *
 * Assembled with flat reads and Maps rather than embedded joins, the
 * same way `listReviewAppeals` is and for the same reason: `reports` is
 * polymorphic — `target_id` points at one of six tables depending on
 * `target_type` — so there is no foreign key for PostgREST to hint a
 * relationship from, and no embed that could express it.
 */

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type ReportTargetType =
  | "message"
  | "profile"
  | "hustle"
  | "skill"
  | "review"
  | "conversation";

/** Mirrors the check constraint on `reports.reason`. */
export const REPORT_REASON_LABELS: Record<string, string> = {
  spam_or_scam: "Spam or scam",
  harassment: "Harassment",
  hate_speech: "Hate speech",
  explicit_content: "Explicit content",
  impersonation: "Impersonation",
  fee_evasion: "Taking it off-platform",
  illegal_activity: "Illegal activity",
  other: "Other",
};

/**
 * The reasons that should not sit in a queue overnight.
 *
 * Not a severity score — a judgement about what a delay COSTS. Spam
 * left up for a day is noise; a threat left up for a day is the thing
 * the report was trying to stop.
 */
export const URGENT_REASONS = new Set([
  "harassment",
  "hate_speech",
  "illegal_activity",
  "explicit_content",
]);

/** What an account is in the middle of. Mirrors `in_flight_for`. */
export type InFlight = {
  funded: {
    kind: "hustle" | "booking";
    source_id: string;
    amount: number;
    /** Which side of the money they are on. */
    role: "paying" | "working";
    counterparty: string | null;
    counterparty_id: string | null;
    title: string | null;
  }[];
  funded_total: number;
  unfunded: number;
  open_hustles: number;
  skills: number;
  wallet_balance: number;
  pending_withdrawals: number;
};

export type ReportRow = {
  id: string;
  created_at: string;
  status: ReportStatus;
  target_type: ReportTargetType;
  target_id: string;
  conversation_id: string | null;
  reason: string;
  detail: string | null;
  content_snapshot: string | null;
  resolved_at: string | null;
  decision_note: string | null;

  reporter_id: string;
  reporter_name: string | null;
  /** How many reports this person has filed, ever. A reporter with
   * thirty is either the most useful user on the platform or is using
   * the button as a weapon, and either way it changes how you read
   * this one. */
  reporter_total: number;

  /** What was reported, in words. Null when the row it pointed at is
   * gone — which is itself worth showing rather than hiding. */
  target_label: string | null;
  /** Who owns the reported thing, where that's knowable. This is who
   * an enforcement action lands on — never the reporter. */
  owner_id: string | null;
  owner_name: string | null;
  /** For identifying the exact account beyond a display name, which is
   * neither unique nor stable. */
  owner_email: string | null;
  /** Current standing, so a moderator can see they're already suspended
   * before suspending them again. */
  owner_suspended_until: string | null;
  owner_terminated_at: string | null;
  /** What suspending this owner would interrupt. Only fetched for
   * reports still waiting on a decision — it is context for an action,
   * not something to compute for rows already closed. */
  owner_in_flight: InFlight | null;
  /** Reports filed against this owner across everything they've posted.
   * One report is an incident; five is a pattern, and the pattern is
   * usually the actual decision. */
  owner_total: number;
};

type Base = {
  id: string;
  created_at: string;
  status: ReportStatus;
  target_type: ReportTargetType;
  target_id: string;
  conversation_id: string | null;
  reason: string;
  detail: string | null;
  content_snapshot: string | null;
  resolved_at: string | null;
  decision_note: string | null;
  reporter_id: string;
};

/** One reported thing, resolved to something a human can judge. */
type Resolved = { label: string | null; ownerId: string | null };

function displayName(row: {
  full_name?: string | null;
  display_name?: string | null;
}): string | null {
  return row.display_name ?? row.full_name ?? null;
}

/**
 * Every report, newest first.
 *
 * Unfiltered by design — the page does the filtering, so the counts
 * across every status can be shown without a second round trip. The
 * table is small and indexed on `(status, created_at)`; if it ever
 * isn't, this is the place to add a limit.
 */
export async function listReports(): Promise<ReportRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, created_at, status, target_type, target_id, conversation_id, reason, detail, content_snapshot, resolved_at, decision_note, reporter_id"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const reports = (data ?? []) as Base[];
  if (reports.length === 0) return [];

  const idsOfType = (type: ReportTargetType) => [
    ...new Set(
      reports.filter((r) => r.target_type === type).map((r) => r.target_id)
    ),
  ];

  const messageIds = idsOfType("message");
  const profileIds = idsOfType("profile");
  const hustleIds = idsOfType("hustle");
  const skillIds = idsOfType("skill");
  const reviewIds = idsOfType("review");

  // One read per target table, and only for the types actually present.
  const [messages, profiles, hustles, skills, reviews] = await Promise.all([
    messageIds.length
      ? supabase
          .from("messages")
          .select("id, content, sender_id")
          .in("id", messageIds)
      : empty(),
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, display_name")
          .in("id", profileIds)
      : empty(),
    hustleIds.length
      ? supabase
          .from("hustles")
          .select("id, title, provider_id")
          .in("id", hustleIds)
      : empty(),
    skillIds.length
      ? supabase
          .from("hustler_skills")
          .select("id, skill_name, display_name, hustler_id")
          .in("id", skillIds)
      : empty(),
    reviewIds.length
      ? supabase
          .from("reviews")
          .select("id, comment, rating, reviewer_id")
          .in("id", reviewIds)
      : empty(),
  ]);

  const resolved = new Map<string, Resolved>();
  const key = (type: string, id: string) => `${type}:${id}`;

  for (const row of rows(messages)) {
    resolved.set(key("message", row.id), {
      label: truncate(row.content),
      ownerId: row.sender_id ?? null,
    });
  }
  for (const row of rows(profiles)) {
    resolved.set(key("profile", row.id), {
      label: displayName(row) ?? "Unnamed account",
      // A reported profile IS its own owner — that's what makes the
      // "reports against this user" count meaningful on these rows.
      ownerId: row.id,
    });
  }
  for (const row of rows(hustles)) {
    resolved.set(key("hustle", row.id), {
      label: row.title ?? null,
      ownerId: row.provider_id ?? null,
    });
  }
  for (const row of rows(skills)) {
    resolved.set(key("skill", row.id), {
      label: [row.skill_name, row.display_name].filter(Boolean).join(" — ") || null,
      ownerId: row.hustler_id ?? null,
    });
  }
  for (const row of rows(reviews)) {
    resolved.set(key("review", row.id), {
      label: row.comment
        ? `${"★".repeat(row.rating ?? 0)} — ${truncate(row.comment)}`
        : `${"★".repeat(row.rating ?? 0)} (rating only)`,
      ownerId: row.reviewer_id ?? null,
    });
  }

  // Names for everyone involved: reporters, and whoever owns the
  // reported thing. One read, after the targets are known.
  const ownerIds = [...resolved.values()]
    .map((r) => r.ownerId)
    .filter((id): id is string => Boolean(id));
  const nameIds = [
    ...new Set([...reports.map((r) => r.reporter_id), ...ownerIds]),
  ];

  const { data: nameRows } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, suspended_until, terminated_at")
    .in("id", nameIds);

  const profileById = new Map(
    (nameRows ?? []).map((row) => [row.id as string, row])
  );
  const nameById = new Map(
    (nameRows ?? []).map((row) => [row.id as string, displayName(row)])
  );

  // Emails live in `auth.users`, which PostgREST does not expose — the
  // Admin API is the way in. Only for the accounts actually on screen,
  // and only the owners: a reporter's address is not part of judging
  // what they reported.
  const emailById = await emailsFor(supabase, [...new Set(ownerIds)]);

  // Only for owners of reports still waiting. One RPC each, and a
  // decided queue shouldn't pay for context nobody is going to act on.
  const pendingOwners = [
    ...new Set(
      reports
        .filter((r) => r.status === "pending")
        .map((r) => resolved.get(key(r.target_type, r.target_id))?.ownerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const inFlightById = new Map(
    await Promise.all(
      pendingOwners.map(async (id) => {
        const { data } = await supabase.rpc("in_flight_for", {
          p_profile_id: id,
        });
        return [id, (data as InFlight | null) ?? null] as const;
      })
    )
  );

  // Tallies, counted over the reports we already have rather than with
  // extra queries — the whole table is in memory by this point.
  const byReporter = new Map<string, number>();
  for (const r of reports) {
    byReporter.set(r.reporter_id, (byReporter.get(r.reporter_id) ?? 0) + 1);
  }

  const byOwner = new Map<string, number>();
  for (const r of reports) {
    const owner = resolved.get(key(r.target_type, r.target_id))?.ownerId;
    if (owner) byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
  }

  return reports.map((report) => {
    const target = resolved.get(key(report.target_type, report.target_id));
    const ownerId = target?.ownerId ?? null;
    return {
      ...report,
      reporter_name: nameById.get(report.reporter_id) ?? null,
      reporter_total: byReporter.get(report.reporter_id) ?? 1,
      target_label: target?.label ?? null,
      owner_id: ownerId,
      owner_name: ownerId ? (nameById.get(ownerId) ?? null) : null,
      owner_email: ownerId ? (emailById.get(ownerId) ?? null) : null,
      owner_suspended_until: ownerId
        ? ((profileById.get(ownerId)?.suspended_until as string | null) ?? null)
        : null,
      owner_terminated_at: ownerId
        ? ((profileById.get(ownerId)?.terminated_at as string | null) ?? null)
        : null,
      owner_in_flight: ownerId ? (inFlightById.get(ownerId) ?? null) : null,
      owner_total: ownerId ? (byOwner.get(ownerId) ?? 0) : 0,
    };
  });
}

/**
 * Emails for a handful of accounts.
 *
 * `auth.users` is not exposed through PostgREST, so this goes through
 * the Admin API — one call per account rather than one query, which is
 * why it is deliberately scoped to the owners on screen and not to
 * every profile mentioned. A failure yields no email rather than
 * throwing: an address is useful context, not a reason to take the
 * whole queue down.
 */
async function emailsFor(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  ids: string[]
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        return [id, data?.user?.email ?? null] as const;
      } catch {
        return [id, null] as const;
      }
    })
  );
  return new Map(entries);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function empty() {
  return Promise.resolve({ data: [] as any[] });
}
function rows(result: { data: any[] | null }): any[] {
  return result.data ?? [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function truncate(text: string | null, max = 140): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
