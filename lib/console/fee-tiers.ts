import "server-only";

import { naira } from "@/lib/console/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The release fee rate card.
 *
 * sydHustle's main revenue line: what it takes when a Hustle is
 * released, out of what the Hustler is paid. Lives in
 * `platform_fee_tiers`, is applied by `platform_fee_for()`, and is
 * quoted to Hustlers by the app before they accept a price - so all
 * three read the same rows and none of them carries a copy.
 *
 * Marginal-free: the WHOLE Hustle is charged at the rate its size falls
 * into, which is the only version of this anybody can say out loud.
 *
 * The band and sentence helpers below are deliberately duplicated in the
 * app (src/features/wallet/services/platform-fees.ts in the sydHustle
 * repo). Two codebases, one rate card: the numbers come off the same
 * table in both, and only the phrasing is written twice.
 */

export type FeeTier = {
  /** The floor this rate sits ABOVE, exclusive. A Hustle of exactly
   * ₦5,000 is charged by the 0 rung, ₦5,000.01 by the 5000 rung. */
  above_amount: number;
  percent: number;
};

export type FeeTierChange = {
  changed_at: string;
  tiers: FeeTier[];
  previous: FeeTier[] | null;
};

/** The card as it stood when this console was written. Used only when
 * the database cannot be reached on a page that must still render -
 * see `listFeeTiersSafe`. */
export const FEE_TIERS_FALLBACK: FeeTier[] = [
  { above_amount: 0, percent: 10 },
  { above_amount: 5000, percent: 8 },
  { above_amount: 20000, percent: 6 },
  { above_amount: 50000, percent: 5 },
  { above_amount: 100000, percent: 4 },
];

const ascending = (tiers: FeeTier[]) =>
  [...tiers].sort((a, b) => a.above_amount - b.above_amount);

const parse = (rows: { above_amount: unknown; percent: unknown }[]): FeeTier[] =>
  ascending(
    rows.map((row) => ({
      above_amount: Number(row.above_amount),
      percent: Number(row.percent),
    }))
  );

export async function listFeeTiers(): Promise<FeeTier[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_fee_tiers")
    .select("above_amount, percent")
    .order("above_amount", { ascending: true });
  if (error) throw new Error(error.message);
  return parse(data ?? []);
}

/**
 * The same read, for pages that must render whatever happens.
 *
 * /support is the address on the App Store listing. Apple requires it to
 * resolve to a real page with a live contact method on it, so a database
 * that is briefly unreachable must cost that page its live rate card and
 * nothing else. Everywhere inside the console, use `listFeeTiers` and
 * let the error surface: an operator setting a price needs to know the
 * figure in front of them is the real one.
 */
export async function listFeeTiersSafe(): Promise<FeeTier[]> {
  try {
    const tiers = await listFeeTiers();
    return tiers.length > 0 ? tiers : FEE_TIERS_FALLBACK;
  } catch {
    return FEE_TIERS_FALLBACK;
  }
}

/**
 * Every time the card changed, newest first. Bounded to a window so the
 * P&L can say whether the period it is showing straddles a price change.
 *
 * Read loosely, exactly like `getConsoleStats`: the console deploys
 * separately from the schema, so a database that has not yet run
 * 20260824235000 is a normal state for a few minutes. This is context on
 * a statement, not a figure in it - losing it should cost a footnote,
 * never the Earnings page.
 */
export async function listFeeTierChanges(
  from?: string | null,
  toExclusiveIso?: string | null
): Promise<FeeTierChange[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("platform_fee_tier_history")
    .select("changed_at, tiers, previous")
    .order("changed_at", { ascending: false })
    .limit(50);
  if (from) query = query.gte("changed_at", from);
  if (toExclusiveIso) query = query.lt("changed_at", toExclusiveIso);
  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map((row) => ({
    changed_at: String(row.changed_at),
    tiers: parse((row.tiers ?? []) as { above_amount: unknown; percent: unknown }[]),
    previous: row.previous
      ? parse(row.previous as { above_amount: unknown; percent: unknown }[])
      : null,
  }));
}

const rate = (percent: number) =>
  `${Number(percent.toFixed(2)).toLocaleString("en-NG")}%`;

export type FeeBand = { band: string; rate: string; percent: number };

/** The card as rows: "Up to ₦5,000 — 10%". */
export function describeFeeTiers(tiers: FeeTier[]): FeeBand[] {
  const sorted = ascending(tiers);
  return sorted.map((tier, index) => {
    const ceiling = sorted[index + 1]?.above_amount ?? null;
    const floor = tier.above_amount;
    let band: string;
    if (floor === 0 && ceiling === null) band = "Any amount";
    else if (floor === 0) band = `Up to ${naira(ceiling!)}`;
    else if (ceiling === null) band = `Above ${naira(floor)}`;
    else band = `${naira(floor + 1)} – ${naira(ceiling)}`;
    return { band, rate: rate(tier.percent), percent: tier.percent };
  });
}

/** The card in one line, for a summary card: "10% → 4%, by size". */
export function summariseFeeTiers(tiers: FeeTier[]): string {
  const sorted = ascending(tiers);
  if (sorted.length === 0) return "No rate set";
  const first = sorted[0]!.percent;
  const last = sorted[sorted.length - 1]!.percent;
  if (sorted.length === 1 || first === last) {
    return `${rate(first)} of every release`;
  }
  return `${rate(first)} → ${rate(last)}, by size`;
}

/** The card as prose, matching the app's help centre word for word:
 * "10% up to ₦5,000, 8% to ₦20,000, ... and 4% above that". */
export function feeTierSentence(tiers: FeeTier[]): string {
  const sorted = ascending(tiers);
  if (sorted.length === 0) return "no service fee at present";
  if (sorted.length === 1) {
    return `${rate(sorted[0]!.percent)} of every Hustle, whatever its size`;
  }
  return sorted
    .map((tier, index) => {
      const ceiling = sorted[index + 1]?.above_amount ?? null;
      if (ceiling === null) return `and ${rate(tier.percent)} above that`;
      if (index === 0) return `${rate(tier.percent)} up to ${naira(ceiling)}`;
      return `${rate(tier.percent)} to ${naira(ceiling)}`;
    })
    .join(", ");
}
