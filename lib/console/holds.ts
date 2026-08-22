import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Money that landed and cannot move, as the desk sees it.
 *
 * A deposit above the depositor's Provider rung is credited to their
 * wallet and frozen there. Nothing spends it, nothing withdraws it, and
 * exactly two things end that: somebody here clears it, or the user
 * asks for it back and we return it out of the provider's dashboard.
 *
 * Deliberately not folded into payment reports. A report is a user
 * complaining about us; this is us asking about them. Same shape,
 * opposite direction, and one queue holding both is a queue where the
 * reviewer cannot tell which way the question runs.
 */

export type DepositReviewStatus =
  | "flagged"
  | "cleared"
  | "refund_requested"
  | "refunded";

export type DepositReviewRow = {
  id: string;
  profileId: string;
  displayName: string | null;
  accountEmail: string | null;
  reference: string;
  amount: number;
  status: DepositReviewStatus;
  origin: "threshold" | "manual";
  threshold: number | null;
  note: string | null;
  resolution: string | null;
  flaggedBy: string | null;
  decidedBy: string | null;
  createdAt: string;
  decidedAt: string | null;
  refundRequestedAt: string | null;
  refundReference: string | null;
  /** True when this account has a BVN on file — the single most useful
   * thing to know before deciding whether to ask questions or clear. */
  bvnVerified: boolean;
  messageCount: number;
};

export type ReviewMessageRow = {
  id: string;
  authorRole: "admin" | "user";
  authorLabel: string | null;
  body: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
  attachmentUrl: string | null;
  createdAt: string;
};

const EVIDENCE_BUCKET = "review-evidence";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function listDepositReviews(
  status?: DepositReviewStatus
): Promise<DepositReviewRow[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("deposit_reviews")
    .select(
      "id, profile_id, reference, amount, status, origin, threshold, note, resolution, flagged_by, decided_by, created_at, decided_at, refund_requested_at, refund_reference"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, string | number | null>[];
  if (rows.length === 0) return [];

  const profileIds = [...new Set(rows.map((row) => String(row.profile_id)))];
  const reviewIds = rows.map((row) => String(row.id));

  // Three small reads rather than joins: `deposit_reviews` has no
  // PostgREST relationship to `verified_bvns`, and a count per row would
  // be one round trip per row.
  const [profiles, bvns, messages] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", profileIds),
    supabase.from("verified_bvns").select("profile_id").in("profile_id", profileIds),
    supabase
      .from("deposit_review_messages")
      .select("review_id")
      .in("review_id", reviewIds),
  ]);

  const names = new Map(
    ((profiles.data ?? []) as { id: string; display_name: string | null }[]).map(
      (row) => [row.id, row.display_name]
    )
  );
  const withBvn = new Set(
    ((bvns.data ?? []) as { profile_id: string }[]).map((row) => row.profile_id)
  );
  const counts = new Map<string, number>();
  for (const row of (messages.data ?? []) as { review_id: string }[]) {
    counts.set(row.review_id, (counts.get(row.review_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: String(row.id),
    profileId: String(row.profile_id),
    displayName: names.get(String(row.profile_id)) ?? null,
    accountEmail: null,
    reference: String(row.reference),
    amount: Number(row.amount),
    status: row.status as DepositReviewStatus,
    origin: row.origin as DepositReviewRow["origin"],
    threshold: row.threshold === null ? null : Number(row.threshold),
    note: (row.note as string) ?? null,
    resolution: (row.resolution as string) ?? null,
    flaggedBy: (row.flagged_by as string) ?? null,
    decidedBy: (row.decided_by as string) ?? null,
    createdAt: String(row.created_at),
    decidedAt: (row.decided_at as string) ?? null,
    refundRequestedAt: (row.refund_requested_at as string) ?? null,
    refundReference: (row.refund_reference as string) ?? null,
    bvnVerified: withBvn.has(String(row.profile_id)),
    messageCount: counts.get(String(row.id)) ?? 0,
  }));
}

export async function listReviewMessages(
  reviewId: string
): Promise<ReviewMessageRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("deposit_review_messages")
    .select(
      "id, author_role, author_label, body, attachment_path, attachment_name, created_at"
    )
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, string | null>[];
  const paths = rows
    .map((row) => row.attachment_path)
    .filter((path): path is string => Boolean(path));

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: String(row.id),
    authorRole: row.author_role as "admin" | "user",
    authorLabel: row.author_label ?? null,
    body: row.body ?? null,
    attachmentPath: row.attachment_path ?? null,
    attachmentName: row.attachment_name ?? null,
    attachmentUrl: row.attachment_path
      ? (signed.get(row.attachment_path) ?? null)
      : null,
    createdAt: String(row.created_at),
  }));
}

/** How many are waiting, for the nav badge and the page header. */
export async function countOpenReviews(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from("deposit_reviews")
    .select("id", { count: "exact", head: true })
    .in("status", ["flagged", "refund_requested"]);
  return count ?? 0;
}
