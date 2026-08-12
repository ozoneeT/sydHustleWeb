import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** One hustleBoost, with enough of the listing and the buyer to judge it. */
export type BoostRow = {
  id: string;
  skill_id: string;
  hustler_id: string;
  hustler_name: string | null;
  period: "week" | "month";
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  ends_at: string;
  rank: number;
  cancel_reason: string | null;
  created_at: string;
  skill_name: string | null;
  display_name: string | null;
  cover_photo: string | null;
};

export const PERIOD_DAYS: Record<BoostRow["period"], number> = {
  week: 7,
  month: 30,
};

/**
 * Every boost, newest first.
 *
 * Sweeps expiries first so "active" on this page means "running right
 * now". The app's carousel evaluates the window at read time and doesn't
 * care, but a console that lists finished runs as live gets the ranking
 * decision wrong.
 */
export async function listBoosts(): Promise<BoostRow[]> {
  const supabase = createServerSupabaseClient();

  await supabase.rpc("expire_skill_boosts");

  const { data, error } = await supabase
    .from("skill_boosts")
    .select(
      "id, skill_id, hustler_id, period, status, starts_at, ends_at, rank, cancel_reason, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = Omit<
    BoostRow,
    "hustler_name" | "skill_name" | "display_name" | "cover_photo"
  >;
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const skillIds = [...new Set(rows.map((row) => row.skill_id))];
  const profileIds = [...new Set(rows.map((row) => row.hustler_id))];

  const [skills, profiles] = await Promise.all([
    supabase
      .from("hustler_skills")
      .select("id, skill_name, display_name, cover_photo")
      .in("id", skillIds),
    supabase.from("profiles").select("id, full_name").in("id", profileIds),
  ]);

  const skillById = new Map(
    (skills.data ?? []).map((skill) => [skill.id as string, skill])
  );
  const nameById = new Map(
    (profiles.data ?? []).map((profile) => [
      profile.id as string,
      profile.full_name as string | null,
    ])
  );

  return rows.map((row) => {
    const skill = skillById.get(row.skill_id);
    return {
      ...row,
      hustler_name: nameById.get(row.hustler_id) ?? null,
      skill_name: (skill?.skill_name as string | null) ?? null,
      display_name: (skill?.display_name as string | null) ?? null,
      cover_photo: (skill?.cover_photo as string | null) ?? null,
    };
  });
}

export function isLive(row: BoostRow): boolean {
  if (row.status !== "active") return false;
  const now = Date.now();
  return (
    new Date(row.starts_at).getTime() <= now &&
    new Date(row.ends_at).getTime() > now
  );
}

/* ------------------------------------------------------------------ */
/* SMS usage                                                           */
/* ------------------------------------------------------------------ */

/** One subscriber's real consumption against their cap. */
export type SmsUsageRow = {
  profile_id: string;
  full_name: string | null;
  phone: string;
  plan: "weekly" | "monthly";
  status: string;
  auto_renew: boolean;
  current_period_end: string;
  used_this_period: number;
  cap: number;
  sent_all_time: number;
  failed_all_time: number;
  created_at: string;
};

/**
 * What subscribers actually use.
 *
 * The caps (20/week, 60/month) are a guess until this page exists. Real
 * consumption per user per period is what says whether they are generous,
 * mean or irrelevant — and therefore whether ₦300 and ₦700 are the right
 * prices. Read it before changing either.
 */
export async function listSmsUsage(): Promise<SmsUsageRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sms_usage_admin")
    .select("*")
    .order("used_this_period", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SmsUsageRow[];
}
