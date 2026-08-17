import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The certification review queue.
 *
 * Waiting-on-us first, then waiting-on-them, then everything decided. A
 * reviewer opening this page wants the work, not the archive, and sorting by
 * date alone buries a fresh submission under a month of certified listings.
 */

export type CertificationStatus =
  | "submitted"
  | "needs_info"
  | "certified"
  | "rejected";

export type CertificationMessage = {
  id: string;
  authorRole: "admin" | "hustler";
  body: string;
  createdAt: string;
};

export type CertificationDocument = {
  id: string;
  label: string | null;
  uploadedAt: string;
  /**
   * A short-lived signed URL, minted when this page is rendered.
   *
   * The bucket is private and nothing anywhere holds a durable link: a
   * certificate photo carries a full name and a licence number, and a URL
   * that keeps working is a URL that ends up pasted somewhere.
   */
  url: string | null;
};

export type CertificationReview = {
  skillId: string;
  hustlerId: string;
  hustlerName: string;
  hustlerEmail: string | null;
  skillName: string;
  displayName: string;
  coverPhoto: string | null;
  status: CertificationStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  reviewerNote: string | null;
  messages: CertificationMessage[];
  documents: CertificationDocument[];
};

const BUCKET = "skill-certifications";
/** Long enough to open every document on the page, short enough to be
 * useless if the tab is left open on a shared machine. */
const SIGNED_URL_TTL_SECONDS = 10 * 60;

/** Waiting on us, then waiting on them, then the decided ones. */
const STATUS_RANK: Record<CertificationStatus, number> = {
  submitted: 0,
  needs_info: 1,
  rejected: 2,
  certified: 3,
};

export async function listCertificationReviews(): Promise<
  CertificationReview[]
> {
  const supabase = createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from("skill_certifications")
    .select(
      `skill_id, hustler_id, status, submitted_at, decided_at, decided_by,
       reviewer_note,
       hustler_skills!inner ( skill_name, display_name, cover_photo ),
       profiles!inner ( full_name )`,
    )
    .order("submitted_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const skillIds = rows.map((row) => row.skill_id as string);

  const [{ data: messages }, { data: documents }] = await Promise.all([
    supabase
      .from("skill_certification_messages")
      .select("id, skill_id, author_role, body, created_at")
      .in("skill_id", skillIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("skill_certification_documents")
      .select("id, skill_id, storage_path, label, uploaded_at")
      .in("skill_id", skillIds)
      .order("uploaded_at", { ascending: true }),
  ]);

  // One signing round trip for the whole page rather than one per document.
  const paths = (documents ?? []).map((doc) => doc.storage_path as string);
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  const reviews: CertificationReview[] = [];

  for (const row of rows) {
    const skill = row.hustler_skills as unknown as {
      skill_name: string;
      display_name: string;
      cover_photo: string | null;
    };
    const profile = row.profiles as unknown as { full_name: string | null };

    // The email is what the "we need more" notice goes to, and it lives on
    // the auth user rather than the profile.
    const { data: account } = await supabase.auth.admin.getUserById(
      row.hustler_id as string,
    );

    reviews.push({
      skillId: row.skill_id as string,
      hustlerId: row.hustler_id as string,
      hustlerName: profile?.full_name ?? "deleted account",
      hustlerEmail: account?.user?.email ?? null,
      skillName: skill.skill_name,
      displayName: skill.display_name,
      coverPhoto: skill.cover_photo,
      status: row.status as CertificationStatus,
      submittedAt: row.submitted_at as string,
      decidedAt: (row.decided_at as string | null) ?? null,
      decidedBy: (row.decided_by as string | null) ?? null,
      reviewerNote: (row.reviewer_note as string | null) ?? null,
      messages: (messages ?? [])
        .filter((message) => message.skill_id === row.skill_id)
        .map((message) => ({
          id: message.id as string,
          authorRole: message.author_role as "admin" | "hustler",
          body: message.body as string,
          createdAt: message.created_at as string,
        })),
      documents: (documents ?? [])
        .filter((doc) => doc.skill_id === row.skill_id)
        .map((doc) => ({
          id: doc.id as string,
          label: (doc.label as string | null) ?? null,
          uploadedAt: doc.uploaded_at as string,
          url: signed.get(doc.storage_path as string) ?? null,
        })),
    });
  }

  return reviews.sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.submittedAt.localeCompare(b.submittedAt),
  );
}
