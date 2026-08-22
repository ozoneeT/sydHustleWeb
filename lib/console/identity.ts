import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The identity vault's index — everything ABOUT a retained record, and
 * nothing IN one.
 *
 * These queries deliberately never select `encrypted_payload`. Listing
 * who has a record on file is ordinary admin work; opening one is a
 * disclosure, goes through the edge function, and is logged. Keeping
 * the ciphertext out of the list means the page can't leak it by
 * accident.
 */

export type RetainedIdentityRow = {
  profile_id: string;
  provider: string;
  provider_ref: string | null;
  verified_at: string | null;
  account_email: string | null;
  account_deleted_at: string | null;
  purge_after: string | null;
  /** Null once the account is gone — the record outlives the profile. */
  display_name: string | null;
  /** The second document, and whether we are currently asking for it.
   * Both live here rather than on their own page because the question
   * "do we trust this identity" is one question, and answering it from
   * two screens is how one of them gets forgotten. */
  bvn_verified: boolean;
  bvn_requested: boolean;
};

export async function listRetainedIdentityRecords(
  query?: string
): Promise<RetainedIdentityRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("retained_identity_records")
    .select(
      "profile_id, provider, provider_ref, verified_at, account_email, account_deleted_at, purge_after"
    )
    .order("verified_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<
    RetainedIdentityRow,
    "display_name" | "bvn_verified" | "bvn_requested"
  >[];
  if (rows.length === 0) return [];

  // Names come from the live profile when there still is one. A separate
  // read rather than a join: `retained_identity_records` has no FK to
  // profiles precisely so it can survive deletion, so PostgREST has no
  // relationship to embed.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in(
      "id",
      rows.map((row) => row.profile_id)
    );
  const names = new Map(
    ((profiles ?? []) as { id: string; display_name: string | null }[]).map(
      (row) => [row.id, row.display_name]
    )
  );

  const ids = rows.map((row) => row.profile_id);
  const [bvns, requests] = await Promise.all([
    supabase.from("verified_bvns").select("profile_id").in("profile_id", ids),
    supabase
      .from("bvn_requests")
      .select("profile_id")
      .eq("status", "open")
      .in("profile_id", ids),
  ]);
  const verified = new Set(
    ((bvns.data ?? []) as { profile_id: string }[]).map((row) => row.profile_id)
  );
  const asked = new Set(
    ((requests.data ?? []) as { profile_id: string }[]).map(
      (row) => row.profile_id
    )
  );

  const withNames = rows.map((row) => ({
    ...row,
    display_name: names.get(row.profile_id) ?? null,
    bvn_verified: verified.has(row.profile_id),
    bvn_requested: asked.has(row.profile_id),
  }));

  const needle = query?.trim().toLowerCase();
  if (!needle) return withNames;
  return withNames.filter(
    (row) =>
      row.display_name?.toLowerCase().includes(needle) ||
      row.account_email?.toLowerCase().includes(needle) ||
      row.profile_id.toLowerCase().includes(needle) ||
      row.provider_ref?.toLowerCase().includes(needle)
  );
}

export type DisclosureRow = {
  id: string;
  profile_id: string;
  provider_ref: string | null;
  reason: string;
  disclosed_at: string;
};

/** The audit trail, newest first. Shown on the same page as the reveal
 * button on purpose: an access log nobody sees deters nobody. */
export async function listIdentityDisclosures(
  limit = 50
): Promise<DisclosureRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("identity_disclosures")
    .select("id, profile_id, provider_ref, reason, disclosed_at")
    .order("disclosed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DisclosureRow[];
}
