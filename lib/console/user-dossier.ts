import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listReports, type ReportRow } from "@/lib/console/reports";

/**
 * Everything the desk knows about one account, gathered once.
 *
 * The console had this spread across eight tabs, each of which wanted a
 * different identifier to search by, so answering "what is going on with
 * this person" meant finding the same account eight times. This is the
 * single read behind the one page that answers it.
 *
 * Two things it deliberately does NOT do:
 *
 *   - It does not fail as a unit. Each section is settled on its own, so
 *     one missing relation costs that panel and nothing else. The
 *     identity page went down whole for exactly this reason.
 *   - It does not decide anything. Every section is a read; enforcement
 *     stays in the actions that own the audit trail.
 */

export type DossierSection<T> =
  | { ok: true; rows: T[] }
  | { ok: false; error: string };

export type ListingRow = {
  id: string;
  skill_name: string | null;
  display_name: string | null;
  pricing_type: string | null;
  price_amount: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  certified: boolean | null;
  removed_at: string | null;
  removed_reason: string | null;
  created_at: string;
};

export type HustleRow = {
  id: string;
  title: string | null;
  status: string | null;
  price: number | null;
  area_label: string | null;
  created_at: string;
  provider_id: string;
  assigned_hustler_id: string | null;
};

export type HoldAppealRow = {
  id: string;
  conversation_id: string | null;
  ground: string | null;
  detail: string | null;
  status: string | null;
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
};

export type ReviewAppealRow = {
  id: string;
  review_id: string | null;
  ground: string | null;
  detail: string | null;
  status: string | null;
  decision_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type IdentityRow = {
  id: string;
  id_type: string | null;
  provider: string | null;
  provider_ref: string | null;
  status: string | null;
  failure_reason: string | null;
  waived_at: string | null;
  waived_reason: string | null;
  created_at: string;
};

export type RetainedRow = {
  id: string;
  id_type: string | null;
  provider: string | null;
  provider_ref: string | null;
  account_email: string | null;
  verified_at: string | null;
  account_deleted_at: string | null;
  purge_after: string | null;
};

export type UserDossier = {
  listings: DossierSection<ListingRow>;
  posted: DossierSection<HustleRow>;
  worked: DossierSection<HustleRow>;
  reportsFiled: DossierSection<ReportRow>;
  reportsAgainst: DossierSection<ReportRow>;
  holdAppeals: DossierSection<HoldAppealRow>;
  reviewAppeals: DossierSection<ReviewAppealRow>;
  identity: DossierSection<IdentityRow>;
  retained: DossierSection<RetainedRow>;
};

/** A rejected section becomes a message on that panel, never a 500. */
function settle<T>(r: PromiseSettledResult<T[]>): DossierSection<T> {
  if (r.status === "fulfilled") return { ok: true, rows: r.value };
  const message =
    r.reason instanceof Error ? r.reason.message : String(r.reason);
  console.error("user dossier section failed:", message);
  return { ok: false, error: message };
}

async function rows<T>(
  build: () => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await build();
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function getUserDossier(profileId: string): Promise<UserDossier> {
  const supabase = createServerSupabaseClient();

  const settled = await Promise.allSettled([
    rows<ListingRow>(() =>
      supabase
        .from("hustler_skills")
        .select(
          "id, skill_name, display_name, pricing_type, price_amount, rating_avg, rating_count, certified, removed_at, removed_reason, created_at"
        )
        .eq("hustler_id", profileId)
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    rows<HustleRow>(() =>
      supabase
        .from("hustles")
        .select(
          "id, title, status, price, area_label, created_at, provider_id, assigned_hustler_id"
        )
        .eq("provider_id", profileId)
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    rows<HustleRow>(() =>
      supabase
        .from("hustles")
        .select(
          "id, title, status, price, area_label, created_at, provider_id, assigned_hustler_id"
        )
        .eq("assigned_hustler_id", profileId)
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    rows<HoldAppealRow>(() =>
      supabase
        .from("hold_appeals")
        .select(
          "id, conversation_id, ground, detail, status, decision_note, created_at, decided_at"
        )
        .eq("appellant_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    rows<ReviewAppealRow>(() =>
      supabase
        .from("review_appeals")
        .select(
          "id, review_id, ground, detail, status, decision_note, created_at, resolved_at"
        )
        .eq("appellant_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    rows<IdentityRow>(() =>
      supabase
        .from("identity_verifications")
        .select(
          "id, id_type, provider, provider_ref, status, failure_reason, waived_at, waived_reason, created_at"
        )
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    rows<RetainedRow>(() =>
      supabase
        .from("retained_identity_records")
        .select(
          "id, id_type, provider, provider_ref, account_email, verified_at, account_deleted_at, purge_after"
        )
        .eq("profile_id", profileId)
        .limit(20)
    ),
    /*
     * Reports come from the reports module rather than a raw select.
     *
     * A report never points at a person: it points at a skill or a
     * hustle, and the account an action lands on is whoever owns that.
     * `listReports` already resolves owners, names and totals, and
     * splitting them here by hand would mean a second, quietly
     * different answer to "who was reported".
     */
    listReports().then((all) => all),
  ]);

  const reportsResult = settled[7] as PromiseSettledResult<ReportRow[]>;
  const filed: DossierSection<ReportRow> =
    reportsResult.status === "fulfilled"
      ? {
          ok: true,
          rows: reportsResult.value.filter((r) => r.reporter_id === profileId),
        }
      : settle(reportsResult);
  const against: DossierSection<ReportRow> =
    reportsResult.status === "fulfilled"
      ? {
          ok: true,
          rows: reportsResult.value.filter((r) => r.owner_id === profileId),
        }
      : settle(reportsResult);

  return {
    listings: settle(settled[0] as PromiseSettledResult<ListingRow[]>),
    posted: settle(settled[1] as PromiseSettledResult<HustleRow[]>),
    worked: settle(settled[2] as PromiseSettledResult<HustleRow[]>),
    holdAppeals: settle(settled[3] as PromiseSettledResult<HoldAppealRow[]>),
    reviewAppeals: settle(
      settled[4] as PromiseSettledResult<ReviewAppealRow[]>
    ),
    identity: settle(settled[5] as PromiseSettledResult<IdentityRow[]>),
    retained: settle(settled[6] as PromiseSettledResult<RetainedRow[]>),
    reportsFiled: filed,
    reportsAgainst: against,
  };
}
