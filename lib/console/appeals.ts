import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Appeals — the disputes an admin has to decide.
 *
 * An appeal is a Hustle application or a Skill booking sitting at
 * 'appealed': one side said the work wasn't done, the other disagreed,
 * and the escrow is frozen until someone with authority says who is
 * right. Nothing in the app can leave that state, which is the whole
 * reason this screen exists.
 */

export type AppealKind = "hustle" | "booking";

export type AppealSummary = {
  kind: AppealKind;
  /** hustle_applications.id or skill_bookings.id — the id shown in the list. */
  id: string;
  title: string;
  amount: number;
  /** The person who paid, and who gets a refund if they win. */
  providerId: string;
  providerName: string;
  /** The person who did the work, and who gets paid if they win. */
  hustlerId: string;
  hustlerName: string;
  appealedAt: string;
  escrowHeld: boolean;
  resolvedAt: string | null;
  awardedTo: "provider" | "hustler" | null;
};

export type AppealMessage = {
  id: string;
  authorRole: "admin" | "provider" | "hustler";
  recipientRole: "provider" | "hustler" | null;
  body: string | null;
  createdAt: string;
  attachment: {
    kind: "image" | "file";
    name: string | null;
    /** Signed — the evidence bucket is private, and stays that way. */
    url: string | null;
  } | null;
};

const EVIDENCE_BUCKET = "appeal-evidence";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type ProfileName = { id: string; display_name: string | null; full_name: string | null };

function nameOf(map: Map<string, ProfileName>, id: string): string {
  const row = map.get(id);
  return row?.display_name ?? row?.full_name ?? "Unknown";
}

async function loadNames(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  ids: string[]
): Promise<Map<string, ProfileName>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, full_name")
    .in("id", unique);

  return new Map((data ?? []).map((row) => [row.id, row as ProfileName]));
}

/**
 * Every appeal, open ones first and oldest-first within that — a dispute
 * that has been waiting three days matters more than one from an hour
 * ago, and sorting newest-first would bury it.
 */
export async function listAppeals(): Promise<AppealSummary[]> {
  const supabase = createServerSupabaseClient();

  /**
   * Resolutions FIRST, because they decide what to fetch.
   *
   * Deciding an appeal moves the row off 'appealed' - awarding the worker
   * releases the payment, awarding the payer refunds it - so a query that
   * only asks for 'appealed' loses the case the moment it is judged. The
   * list emptied itself, and the detail page 404'd on the very appeal the
   * reviewer had just decided, with no confirmation that anything had
   * happened.
   *
   * The rest of this function always expected otherwise: it carries
   * `resolvedAt` and `awardedTo`, and sorts resolved cases last. Only the
   * source queries disagreed.
   */
  const [resolutions, holds] = await Promise.all([
    supabase.from("appeal_resolutions").select("kind, source_id, awarded_to, resolved_at"),
    supabase.from("escrow_holds").select("kind, source_id").eq("status", "held"),
  ]);

  /** Still open, OR judged at some point - whatever the row says now. */
  const openOrJudged = (kind: AppealKind) => {
    const ids = (resolutions.data ?? [])
      .filter((r) => r.kind === kind)
      .map((r) => r.source_id as string);
    return ids.length > 0
      ? `status.eq.appealed,id.in.(${ids.join(",")})`
      : "status.eq.appealed";
  };

  const [applications, bookings] = await Promise.all([
    supabase
      .from("hustle_applications")
      .select("id, hustler_id, agreed_amount, updated_at, hustle:hustles(title, provider_id)")
      .or(openOrJudged("hustle")),
    supabase
      .from("skill_bookings")
      .select("id, client_id, provider_id, agreed_amount, updated_at, skill:hustler_skills(skill_name)")
      .or(openOrJudged("booking")),
  ]);

  const resolvedBy = new Map(
    (resolutions.data ?? []).map((r) => [`${r.kind}:${r.source_id}`, r])
  );
  const heldSet = new Set(
    (holds.data ?? []).map((h) => `${h.kind}:${h.source_id}`)
  );

  const rows: Omit<AppealSummary, "providerName" | "hustlerName">[] = [];

  for (const row of applications.data ?? []) {
    // Supabase types an embedded to-one join as an array in some shapes;
    // normalise rather than trusting either.
    const hustle = (Array.isArray(row.hustle) ? row.hustle[0] : row.hustle) as
      | { title: string; provider_id: string }
      | undefined;
    if (!hustle) continue;
    const resolution = resolvedBy.get(`hustle:${row.id}`);
    rows.push({
      kind: "hustle",
      id: row.id,
      title: hustle.title,
      amount: Number(row.agreed_amount ?? 0),
      providerId: hustle.provider_id,
      hustlerId: row.hustler_id,
      appealedAt: row.updated_at,
      escrowHeld: heldSet.has(`hustle:${row.id}`),
      resolvedAt: resolution?.resolved_at ?? null,
      awardedTo: (resolution?.awarded_to as "provider" | "hustler") ?? null,
    });
  }

  for (const row of bookings.data ?? []) {
    const skill = (Array.isArray(row.skill) ? row.skill[0] : row.skill) as
      | { skill_name: string }
      | undefined;
    const resolution = resolvedBy.get(`booking:${row.id}`);
    rows.push({
      kind: "booking",
      id: row.id,
      title: skill?.skill_name ?? "Skill booking",
      amount: Number(row.agreed_amount ?? 0),
      // On a booking the client is the payer and the skill owner did the
      // work — the same two roles, named differently by that table.
      providerId: row.client_id,
      hustlerId: row.provider_id,
      appealedAt: row.updated_at,
      escrowHeld: heldSet.has(`booking:${row.id}`),
      resolvedAt: resolution?.resolved_at ?? null,
      awardedTo: (resolution?.awarded_to as "provider" | "hustler") ?? null,
    });
  }

  const names = await loadNames(
    supabase,
    rows.flatMap((row) => [row.providerId, row.hustlerId])
  );

  return rows
    .map((row) => ({
      ...row,
      providerName: nameOf(names, row.providerId),
      hustlerName: nameOf(names, row.hustlerId),
    }))
    .sort((a, b) => {
      if (!a.resolvedAt !== !b.resolvedAt) return a.resolvedAt ? 1 : -1;
      return a.appealedAt < b.appealedAt ? -1 : 1;
    });
}

export async function getAppeal(
  kind: AppealKind,
  id: string
): Promise<AppealSummary | null> {
  const all = await listAppeals();
  return all.find((row) => row.kind === kind && row.id === id) ?? null;
}

export async function listAppealMessages(
  kind: AppealKind,
  id: string
): Promise<AppealMessage[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("appeal_messages")
    .select(
      "id, author_role, recipient_role, body, created_at, attachment_path, attachment_kind, attachment_name"
    )
    .eq("kind", kind)
    .eq("source_id", id)
    .order("created_at", { ascending: true });

  const rows = data ?? [];

  // Signed in one batch. The service role can read the whole bucket, so
  // unlike either party the console sees every piece of evidence — which
  // is the entire point of it deciding.
  const paths = rows
    .map((row) => row.attachment_path as string | null)
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
    id: row.id,
    authorRole: row.author_role,
    recipientRole: row.recipient_role,
    body: row.body,
    createdAt: row.created_at,
    attachment: row.attachment_path
      ? {
          kind: row.attachment_kind as "image" | "file",
          name: row.attachment_name as string | null,
          url: signed.get(row.attachment_path as string) ?? null,
        }
      : null,
  }));
}
