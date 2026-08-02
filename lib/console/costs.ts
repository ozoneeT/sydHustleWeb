import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** The cost sheet — every naira it takes to run sydHustle. */

export type CostRow = {
  id: string;
  name: string;
  category: "service" | "maintenance" | "promotion" | "publicity" | "other";
  kind: "recurring" | "one_off";
  cycle: "monthly" | "yearly" | null;
  started_on: string | null;
  ended_on: string | null;
  active: boolean;
  spent_on: string | null;
  currency: "NGN" | "USD";
  amount: number;
  fx_rate: number | null;
  amount_ngn: number;
  note: string | null;
};

export type CostSummary = {
  /** Active recurring services, normalised to naira per month. */
  monthlyRunRate: number;
  /** One-off spends in the last 30 days. */
  oneOffs30d: number;
  /** One-off spends, all-time. */
  oneOffsTotal: number;
  /** Recurring services accrued since each started (estimate: whole
   * months, ended services stop at their end date). */
  recurringAccrued: number;
  /** oneOffsTotal + recurringAccrued */
  totalAllTime: number;
  /** oneOffs30d + monthlyRunRate — what a typical month costs now. */
  total30d: number;
};

export async function listCosts(): Promise<CostRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_costs")
    .select(
      "id, name, category, kind, cycle, started_on, ended_on, active, spent_on, currency, amount, fx_rate, amount_ngn, note"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CostRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
    fx_rate: row.fx_rate === null ? null : Number(row.fx_rate),
    amount_ngn: Number(row.amount_ngn),
  }));
}

function monthsBetween(fromIso: string, toMs: number): number {
  const from = new Date(fromIso);
  const to = new Date(toMs);
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  // The first month is paid on day one.
  return Math.max(1, months + 1);
}

/** The whole cost sheet in one call — rows plus the summary, stamped with
 * the request's clock so page components stay pure. */
export async function getCostSheet(): Promise<{
  rows: CostRow[];
  summary: CostSummary;
}> {
  const rows = await listCosts();
  return { rows, summary: summarizeCosts(rows, Date.now()) };
}

export function summarizeCosts(rows: CostRow[], nowMs: number): CostSummary {
  const cutoff30d = nowMs - 30 * 24 * 60 * 60 * 1000;

  let monthlyRunRate = 0;
  let recurringAccrued = 0;
  let oneOffsTotal = 0;
  let oneOffs30d = 0;

  for (const row of rows) {
    if (row.kind === "one_off") {
      oneOffsTotal += row.amount_ngn;
      if (row.spent_on && new Date(row.spent_on).getTime() >= cutoff30d) {
        oneOffs30d += row.amount_ngn;
      }
      continue;
    }

    const perMonth =
      row.cycle === "yearly" ? row.amount_ngn / 12 : row.amount_ngn;
    if (row.active) monthlyRunRate += perMonth;

    if (row.started_on) {
      const endMs = row.ended_on ? new Date(row.ended_on).getTime() : nowMs;
      recurringAccrued += perMonth * monthsBetween(row.started_on, endMs);
    }
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    monthlyRunRate: round(monthlyRunRate),
    oneOffs30d: round(oneOffs30d),
    oneOffsTotal: round(oneOffsTotal),
    recurringAccrued: round(recurringAccrued),
    totalAllTime: round(oneOffsTotal + recurringAccrued),
    total30d: round(oneOffs30d + monthlyRunRate),
  };
}
