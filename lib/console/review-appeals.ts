import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Review appeals — a Hustler asking for a review about them to come down.
 *
 * The judgement this queue exists to make is narrow. A review being
 * unfair, harsh or commercially inconvenient is not a reason to remove
 * it; the app offers a public reply for that, and most people take it.
 * What lands here should be a claim about a rule: wrong person, false
 * statements of fact, retaliation, personal information, abuse, or work
 * that never happened.
 *
 * The review stays visible in the app the whole time this is pending —
 * see the migration's header. So there is no clock pressure to remove a
 * review just to stop the bleeding, and equally no reason to sit on one:
 * a genuinely abusive review is up until somebody acts.
 */

export const APPEAL_GROUND_LABELS: Record<string, string> = {
  not_me: "Not about them",
  false_claims: "False claims",
  retaliation: "Retaliation",
  personal_info: "Personal information",
  harassment: "Abuse or threats",
  never_happened: "Work never happened",
};

/** What each ground actually obliges you to check before deciding. */
export const APPEAL_GROUND_TESTS: Record<string, string> = {
  not_me:
    "Does the booking or Hustle behind this review actually involve the appellant?",
  false_claims:
    "Is the disputed statement checkable against the booking, the chat or the money trail? Opinion isn't a false claim.",
  retaliation:
    "Is there a refusal in the chat — a refund, a discount, an off-app request — shortly before this review landed?",
  personal_info:
    "Does the comment name an address, phone number, workplace or anything else that identifies them off the platform?",
  harassment: "Is this abuse, a threat, or hate — rather than simply angry?",
  never_happened:
    "Did money actually move? A settled escrow means the work happened, whatever the review says about how well.",
};

export type ReviewAppealRow = {
  id: string;
  status: "pending" | "upheld" | "rejected";
  ground: string;
  detail: string;
  decision_note: string | null;
  created_at: string;
  resolved_at: string | null;

  review_id: string;
  review_kind: "hustle" | "booking";
  review_source_id: string;
  rating: number;
  comment: string | null;
  review_published_at: string | null;
  review_removed_at: string | null;
  reply_body: string | null;

  /** Who is appealing — the person the review is about. */
  appellant_id: string;
  appellant_name: string | null;
  /** Who wrote the review. */
  reviewer_id: string;
  reviewer_name: string | null;

  skill_id: string | null;
  skill_name: string | null;
};

type AppealBase = {
  id: string;
  review_id: string;
  appellant_id: string;
  ground: string;
  detail: string;
  status: ReviewAppealRow["status"];
  decision_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type ReviewBase = {
  id: string;
  kind: "hustle" | "booking";
  source_id: string;
  skill_id: string | null;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  published_at: string | null;
  removed_at: string | null;
  reply_body: string | null;
};

/**
 * Every appeal, newest first.
 *
 * Assembled with follow-up selects rather than one embedded join:
 * `review_appeals` has no foreign key PostgREST can hint a relationship
 * from to `profiles` (it reaches them through `reviews`), and spelling
 * that out as nested embeds is more fragile than three flat reads.
 */
export async function listReviewAppeals(): Promise<ReviewAppealRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("review_appeals")
    .select(
      "id, review_id, appellant_id, ground, detail, status, decision_note, created_at, resolved_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const appeals = (data ?? []) as AppealBase[];
  if (appeals.length === 0) return [];

  const reviewIds = [...new Set(appeals.map((row) => row.review_id))];
  const { data: reviewData, error: reviewError } = await supabase
    .from("reviews")
    .select(
      "id, kind, source_id, skill_id, reviewer_id, rating, comment, published_at, removed_at, reply_body"
    )
    .in("id", reviewIds);
  if (reviewError) throw new Error(reviewError.message);

  const reviews = (reviewData ?? []) as ReviewBase[];
  const reviewById = new Map(reviews.map((row) => [row.id, row]));

  const profileIds = [
    ...new Set([
      ...appeals.map((row) => row.appellant_id),
      ...reviews.map((row) => row.reviewer_id),
    ]),
  ];
  const skillIds = [
    ...new Set(reviews.map((row) => row.skill_id).filter((id): id is string => id !== null)),
  ];

  const [profiles, skills] = await Promise.all([
    supabase.from("profiles").select("id, full_name, display_name").in("id", profileIds),
    skillIds.length > 0
      ? supabase.from("hustler_skills").select("id, skill_name").in("id", skillIds)
      : Promise.resolve({ data: [] as { id: string; skill_name: string }[] }),
  ]);

  const nameById = new Map(
    (profiles.data ?? []).map((profile) => [
      profile.id as string,
      ((profile.display_name ?? profile.full_name) as string | null) ?? null,
    ])
  );
  const skillNameById = new Map(
    (skills.data ?? []).map((skill) => [skill.id as string, skill.skill_name as string])
  );

  return appeals.map((appeal) => {
    const review = reviewById.get(appeal.review_id);
    return {
      id: appeal.id,
      status: appeal.status,
      ground: appeal.ground,
      detail: appeal.detail,
      decision_note: appeal.decision_note,
      created_at: appeal.created_at,
      resolved_at: appeal.resolved_at,

      review_id: appeal.review_id,
      review_kind: review?.kind ?? "booking",
      review_source_id: review?.source_id ?? "",
      rating: review?.rating ?? 0,
      comment: review?.comment ?? null,
      review_published_at: review?.published_at ?? null,
      review_removed_at: review?.removed_at ?? null,
      reply_body: review?.reply_body ?? null,

      appellant_id: appeal.appellant_id,
      appellant_name: nameById.get(appeal.appellant_id) ?? null,
      reviewer_id: review?.reviewer_id ?? "",
      reviewer_name: review ? (nameById.get(review.reviewer_id) ?? null) : null,

      skill_id: review?.skill_id ?? null,
      skill_name: review?.skill_id
        ? (skillNameById.get(review.skill_id) ?? null)
        : null,
    };
  });
}

/**
 * How many reviews this reviewer has had appealed, and how many of those
 * were upheld.
 *
 * The number worth having on screen. One upheld appeal against someone
 * is a bad review; a pattern of them is a person using reviews as a
 * weapon, and that is a different decision — about the account, not the
 * review.
 */
export async function reviewerAppealHistory(
  reviewerIds: string[]
): Promise<Map<string, { appealed: number; upheld: number }>> {
  const out = new Map<string, { appealed: number; upheld: number }>();
  if (reviewerIds.length === 0) return out;

  const supabase = createServerSupabaseClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_id")
    .in("reviewer_id", reviewerIds);

  const rows = (reviews ?? []) as { id: string; reviewer_id: string }[];
  if (rows.length === 0) return out;

  const { data: appeals } = await supabase
    .from("review_appeals")
    .select("review_id, status")
    .in(
      "review_id",
      rows.map((row) => row.id)
    );

  const reviewerByReviewId = new Map(rows.map((row) => [row.id, row.reviewer_id]));

  for (const appeal of (appeals ?? []) as {
    review_id: string;
    status: string;
  }[]) {
    const reviewerId = reviewerByReviewId.get(appeal.review_id);
    if (!reviewerId) continue;
    const entry = out.get(reviewerId) ?? { appealed: 0, upheld: 0 };
    entry.appealed += 1;
    if (appeal.status === "upheld") entry.upheld += 1;
    out.set(reviewerId, entry);
  }

  return out;
}
