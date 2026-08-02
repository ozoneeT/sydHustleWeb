import "server-only";

import { listCosts } from "@/lib/console/costs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * A standard profit & loss for an arbitrary period.
 *
 * Revenue events count on the day they were earned. One-off costs count
 * if spent inside the period. Recurring services are prorated by day
 * over however much of the period they were actually running — a
 * ₦15,000/month service contributes ₦7,500 to a two-week statement.
 */

export type PnlPreset = {
  label: string;
  from: string;
  to: string;
};

export type ProfitAndLoss = {
  from: string | null;
  to: string | null;
  /** Quick ranges, computed against today's calendar. */
  presets: PnlPreset[];
  revenue: {
    withdrawalFees: number;
    escrowFees: number;
    smsFees: number;
    total: number;
  };
  costs: {
    recurringAccrued: number;
    oneOffs: number;
    total: number;
  };
  net: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const AVG_MONTH_DAYS = 30.4375; // 365.25 / 12
const AVG_YEAR_DAYS = 365.25;

const round = (value: number) => Math.round(value * 100) / 100;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildPresets(nowMs: number): PnlPreset[] {
  const now = new Date(nowMs);
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    {
      label: "This month",
      from: iso(new Date(y, m, 1)),
      to: iso(now),
    },
    {
      label: "Last month",
      from: iso(new Date(y, m - 1, 1)),
      to: iso(new Date(y, m, 0)),
    },
    {
      label: "This year",
      from: iso(new Date(y, 0, 1)),
      to: iso(now),
    },
  ];
}

export async function getProfitAndLoss(
  fromParam?: string,
  toParam?: string
): Promise<ProfitAndLoss> {
  let from = fromParam && !Number.isNaN(Date.parse(fromParam)) ? fromParam : null;
  let to = toParam && !Number.isNaN(Date.parse(toParam)) ? toParam : null;
  if (from && to && Date.parse(to) < Date.parse(from)) {
    [from, to] = [to, from];
  }

  const fromMs = from ? Date.parse(from) : null;
  // Inclusive: "to 31/07" means through the end of that day.
  const toEndMs = to ? Date.parse(to) + DAY_MS : null;
  const nowMs = Date.now();

  const supabase = createServerSupabaseClient();
  let revenueQuery = supabase.from("platform_revenue").select("kind, amount");
  if (from) revenueQuery = revenueQuery.gte("created_at", from);
  if (toEndMs !== null) {
    revenueQuery = revenueQuery.lt(
      "created_at",
      new Date(toEndMs).toISOString()
    );
  }
  const [{ data: revenueRows, error }, costRows] = await Promise.all([
    revenueQuery,
    listCosts(),
  ]);
  if (error) throw new Error(error.message);

  let withdrawalFees = 0;
  let escrowFees = 0;
  let smsFees = 0;
  for (const row of revenueRows ?? []) {
    const amount = Number(row.amount);
    if (row.kind === "withdrawal_fee") withdrawalFees += amount;
    else if (row.kind === "escrow_refund_fee") escrowFees += amount;
    else if (row.kind === "sms_subscription") smsFees += amount;
  }

  let oneOffs = 0;
  let recurringAccrued = 0;
  for (const row of costRows) {
    if (row.kind === "one_off") {
      if (!row.spent_on) continue;
      const spentMs = Date.parse(row.spent_on);
      if (fromMs !== null && spentMs < fromMs) continue;
      if (toEndMs !== null && spentMs >= toEndMs) continue;
      oneOffs += row.amount_ngn;
      continue;
    }

    if (!row.started_on) continue;
    const serviceStart = Date.parse(row.started_on);
    const serviceEnd = row.ended_on
      ? Date.parse(row.ended_on) + DAY_MS
      : Math.min(nowMs, toEndMs ?? nowMs);

    const overlapStart = Math.max(serviceStart, fromMs ?? serviceStart);
    const overlapEnd = Math.min(serviceEnd, toEndMs ?? nowMs);
    if (overlapEnd <= overlapStart) continue;

    const days = (overlapEnd - overlapStart) / DAY_MS;
    const dailyRate =
      row.cycle === "yearly"
        ? row.amount_ngn / AVG_YEAR_DAYS
        : row.amount_ngn / AVG_MONTH_DAYS;
    recurringAccrued += dailyRate * days;
  }

  const revenueTotal = withdrawalFees + escrowFees + smsFees;
  const costsTotal = oneOffs + recurringAccrued;

  return {
    from,
    to,
    presets: buildPresets(nowMs),
    revenue: {
      withdrawalFees: round(withdrawalFees),
      escrowFees: round(escrowFees),
      smsFees: round(smsFees),
      total: round(revenueTotal),
    },
    costs: {
      recurringAccrued: round(recurringAccrued),
      oneOffs: round(oneOffs),
      total: round(costsTotal),
    },
    net: round(revenueTotal - costsTotal),
  };
}
