import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The money ceilings, as the console reads them.
 *
 * Every figure here is enforced by the database (see
 * 20260822100000_money_limits.sql) and none of it is compiled into the
 * app. That is the whole point of the page these feed: a limit that
 * needs a release to change is a limit that will be wrong for as long
 * as the release takes.
 */

export type MoneyTierLimit = {
  track: "hustler" | "provider";
  rung: number;
  tier_id: string;
  label: string;
  daily_withdrawal_max: number | null;
  deposit_flag_above: number | null;
  bvn_above: number | null;
};

export type AmlSettings = {
  bvn_required_for_all: boolean;
  updated_at: string;
};

const toNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

export async function listMoneyTierLimits(): Promise<MoneyTierLimit[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("money_tier_limits")
    .select(
      "track, rung, tier_id, label, daily_withdrawal_max, deposit_flag_above, bvn_above"
    )
    .order("track", { ascending: true })
    .order("rung", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    track: row.track as MoneyTierLimit["track"],
    rung: Number(row.rung),
    tier_id: String(row.tier_id),
    label: String(row.label),
    daily_withdrawal_max: toNumber(row.daily_withdrawal_max),
    deposit_flag_above: toNumber(row.deposit_flag_above),
    bvn_above: toNumber(row.bvn_above),
  }));
}

export async function getAmlSettings(): Promise<AmlSettings> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("aml_settings")
    .select("bvn_required_for_all, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    bvn_required_for_all: data?.bvn_required_for_all === true,
    updated_at: String(data?.updated_at ?? ""),
  };
}

/** How many accounts have a BVN on file, and how many are being asked
 * for one right now. Two numbers, so the switch below them is flipped
 * with some idea of what it will cost. */
export async function getBvnCounts(): Promise<{
  verified: number;
  openRequests: number;
}> {
  const supabase = createServerSupabaseClient();
  const [verified, requests] = await Promise.all([
    supabase.from("verified_bvns").select("profile_id", { count: "exact", head: true }),
    supabase
      .from("bvn_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);
  return {
    verified: verified.count ?? 0,
    openRequests: requests.count ?? 0,
  };
}
