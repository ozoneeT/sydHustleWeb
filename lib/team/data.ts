import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { r2Config, publicUrl } from "@/lib/team/r2";
import { verifyPassword } from "@/lib/console/password";
import { describeSupabaseError } from "@/lib/supabase/errors";

/**
 * Reads for the team ledger — the roster, the claims, and the
 * evidence attached to them.
 *
 * Everything here goes through the service-role client, so every caller is
 * responsible for having established who is asking first. The two
 * entry points differ in scope on purpose: a member sees only their own
 * rows (`listContributionsFor`), the console sees everyone's
 * (`listContributionsForReview`), and neither function can be talked into
 * the other's job by passing a different argument.
 */

export type MemberStatus = "invited" | "active" | "suspended";
export type ContributionStatus = "pending" | "approved" | "rejected";

export interface TeamMember {
  id: string;
  phone: string;
  /** Null until they sign up and tell us. Whoever added the number knew
   * only the number — see 012_team_member_name_optional.sql. */
  name: string | null;
  status: MemberStatus;
  note: string | null;
  created_at: string;
  last_login_at: string | null;
  /** When they last asked to be settled, or null. Cleared from the console
   * once it's been dealt with, so a value here means "still waiting". */
  settlement_requested_at: string | null;
}

export interface ContributionMedia {
  id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  /** Short-lived, and branded onto files.sydhustle.com where configured. */
  url: string | null;
}

export interface Contribution {
  id: string;
  member_id: string;
  title: string;
  /** Null when they posted a title and nothing else. Optional on purpose
   * — see 013_contribution_body_optional.sql. */
  body: string | null;
  category: string;
  occurred_on: string;
  hours: number | null;
  status: ContributionStatus;
  credited_hours: number | null;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  media: ContributionMedia[];
}

/** A contribution as the console sees it — with whose it is attached. */
export interface ReviewableContribution extends Contribution {
  member: { id: string; name: string | null; phone: string };
}

export interface MemberTotals {
  approved: number;
  pending: number;
  rejected: number;
  /** Credited hours across approved claims — the number that will matter
   * when there is money to divide. */
  creditedHours: number;
}

const MEMBER_COLUMNS =
  "id, phone, name, status, note, created_at, last_login_at, settlement_requested_at";

const CONTRIBUTION_COLUMNS = `
  id, member_id, title, body, category, occurred_on, hours, status,
  credited_hours, review_note, reviewed_at, reviewed_by, created_at,
  team_contribution_media ( id, storage_path, mime_type, size_bytes )
`;

type MediaRow = {
  id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
};

type ContributionRow = Omit<Contribution, "media"> & {
  team_contribution_media: MediaRow[];
};

function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Read URLs for every attachment on a page.
 *
 * The bucket is served publicly, so this is string building rather than
 * signing — no round trip, no expiry, and the files come off Cloudflare's
 * edge cache. The privacy that buys and costs is argued out in
 * lib/team/r2.ts.
 *
 * An unconfigured deployment returns an empty map rather than throwing. A
 * contribution's write-up is still worth reading without its screenshot,
 * and MediaGrid says plainly that the attachment could not be loaded.
 */
function mediaUrls(rows: ContributionRow[]): Map<string, string> {
  const media = rows.flatMap((row) => row.team_contribution_media);
  const urls = new Map<string, string>();
  if (media.length === 0) return urls;

  const config = r2Config();
  if (!config) {
    console.error("R2 is not configured — attachments can't be shown.");
    return urls;
  }

  for (const file of media) {
    urls.set(file.storage_path, publicUrl(config, file.storage_path));
  }
  return urls;
}

function toContribution(
  row: ContributionRow,
  signed: Map<string, string>
): Contribution {
  return {
    id: row.id,
    member_id: row.member_id,
    title: row.title,
    body: row.body,
    category: row.category,
    occurred_on: row.occurred_on,
    hours: num(row.hours),
    status: row.status,
    credited_hours: num(row.credited_hours),
    review_note: row.review_note,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    created_at: row.created_at,
    media: row.team_contribution_media.map((media) => ({
      id: media.id,
      storage_path: media.storage_path,
      mime_type: media.mime_type,
      size_bytes: Number(media.size_bytes),
      url: signed.get(media.storage_path) ?? null,
    })),
  };
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("failed to load a member:", describeSupabaseError(error));
    return null;
  }
  return (data as TeamMember) ?? null;
}

/**
 * The allowlist check, and the only way in.
 *
 * `phone` must already be normalised — see lib/team/phone.ts. A
 * number nobody added returns null, and the signup form says so without
 * saying anything about who is on the roster.
 */
export async function findMemberByPhone(
  phone: string
): Promise<(TeamMember & { hasPassword: boolean }) | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(`${MEMBER_COLUMNS}, password_hash`)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("failed to look up a member by phone:", describeSupabaseError(error));
    return null;
  }
  if (!data) return null;

  const { password_hash: hash, ...member } = data as TeamMember & {
    password_hash: string | null;
  };
  return { ...member, hasPassword: Boolean(hash) };
}

/**
 * Sign-in. Returns null for every kind of failure — number not on the
 * roster, never signed up, wrong password, suspended — so the login form
 * can't be used to find out who is working on sydHustle.
 */
export async function authenticateMember(
  phone: string,
  password: string
): Promise<TeamMember | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, password_hash, status")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("member login lookup failed:", describeSupabaseError(error));
    return null;
  }
  if (!data || data.status !== "active") return null;
  if (!(await verifyPassword(password, data.password_hash))) return null;

  await supabase
    .from("team_members")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.id);

  return getTeamMember(data.id);
}

/** The roster, with enough counted alongside it to be worth looking at. */
export async function listTeam(): Promise<
  (TeamMember & { totals: MemberTotals })[]
> {
  const supabase = createServerSupabaseClient();
  const [{ data: people, error }, { data: claims }] = await Promise.all([
    supabase
      .from("team_members")
      .select(MEMBER_COLUMNS)
      .order("created_at", { ascending: true }),
    supabase
      .from("team_contributions")
      .select("member_id, status, credited_hours"),
  ]);

  if (error) {
    console.error("failed to list members:", describeSupabaseError(error));
    return [];
  }

  const totals = new Map<string, MemberTotals>();
  for (const row of claims ?? []) {
    const current = totals.get(row.member_id) ?? {
      approved: 0,
      pending: 0,
      rejected: 0,
      creditedHours: 0,
    };
    if (row.status === "approved") {
      current.approved += 1;
      current.creditedHours += Number(row.credited_hours ?? 0);
    } else if (row.status === "rejected") {
      current.rejected += 1;
    } else {
      current.pending += 1;
    }
    totals.set(row.member_id, current);
  }

  return ((people as TeamMember[]) ?? []).map((member) => ({
    ...member,
    totals: totals.get(member.id) ?? {
      approved: 0,
      pending: 0,
      rejected: 0,
      creditedHours: 0,
    },
  }));
}

/** Everything one member has posted. Their dashboard, and nobody else's. */
export async function listContributionsFor(
  memberId: string
): Promise<Contribution[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_contributions")
    .select(CONTRIBUTION_COLUMNS)
    .eq("member_id", memberId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to list a member's contributions:", describeSupabaseError(error));
    return [];
  }

  const rows = (data as unknown as ContributionRow[]) ?? [];
  const signed = mediaUrls(rows);
  return rows.map((row) => toContribution(row, signed));
}

export function summarizeContributions(rows: Contribution[]): MemberTotals {
  const totals: MemberTotals = {
    approved: 0,
    pending: 0,
    rejected: 0,
    creditedHours: 0,
  };
  for (const row of rows) {
    if (row.status === "approved") {
      totals.approved += 1;
      totals.creditedHours += row.credited_hours ?? 0;
    } else if (row.status === "rejected") {
      totals.rejected += 1;
    } else {
      totals.pending += 1;
    }
  }
  return totals;
}

/**
 * The console's review queue.
 *
 * Pending claims come back oldest first — a queue people actually work
 * through, rather than a feed where the oldest entry sinks out of sight.
 * Decided ones come back newest first, because that list is read as
 * history.
 */
export async function listContributionsForReview(
  status: ContributionStatus
): Promise<ReviewableContribution[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_contributions")
    .select(`${CONTRIBUTION_COLUMNS}, team_members ( id, name, phone )`)
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" });

  if (error) {
    console.error("failed to list contributions for review:", describeSupabaseError(error));
    return [];
  }

  const rows =
    (data as unknown as (ContributionRow & {
      team_members: { id: string; name: string | null; phone: string } | null;
    })[]) ?? [];

  const signed = mediaUrls(rows);

  return rows.map((row) => ({
    ...toContribution(row, signed),
    member: row.team_members ?? { id: row.member_id, name: null, phone: "—" },
  }));
}

/** Counts for the review tabs, so a queue with nothing in it says so. */
export async function contributionCounts(): Promise<
  Record<ContributionStatus, number>
> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_contributions")
    .select("status");

  const counts: Record<ContributionStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  if (error) {
    console.error("failed to count contributions:", describeSupabaseError(error));
    return counts;
  }
  for (const row of data ?? []) {
    const status = row.status as ContributionStatus;
    if (status in counts) counts[status] += 1;
  }
  return counts;
}
