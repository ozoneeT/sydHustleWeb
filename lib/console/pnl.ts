import "server-only";

import { listCosts } from "@/lib/console/costs";
import {
  listFeeTierChanges,
  listFeeTiers,
  type FeeTier,
} from "@/lib/console/fee-tiers";
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
    /** The main stream: sydHustle's cut of every released Hustle. */
    releaseFees: number;
    /** Charged when a hold is refunded out of a failed transaction. */
    escrowFees: number;
    smsFees: number;
    /** Paid placements on the Skills surface. */
    featureFees: number;
    /** Zero going forward - withdrawals are free - and non-zero for any
     * period before the cut moved to releases. */
    withdrawalFees: number;
    /** sydHustle's cut of money added, when the console has one set.
     * Distinct from what the payment provider charges the payer, which
     * never reaches our account and is a cost line, not a revenue one. */
    depositFees: number;
    total: number;
  };
  /**
   * Stamp duty collected from users and paid to government. Deliberately
   * outside `revenue` and outside `costs`: it passes straight through, and
   * putting it in either would misstate the business by the whole amount.
   */
  passThrough: {
    stampDuty: number;
  };
  costs: {
    recurringAccrued: number;
    oneOffs: number;
    /** What Paystack and Payvessel took, per transaction. Deposits are
     * measured from their own webhooks; payouts are computed from the
     * published transfer bands. */
    providerDeposits: number;
    providerPayouts: number;
    /**
     * What Apple and Google keep of an in-app purchase.
     *
     * Always an estimate, and never quietly promoted to exact: the
     * store charges the user in their own currency at their own price
     * point and remits after their own FX, so the true figure exists
     * only on a settlement report. An estimate here is the difference
     * between a cost line that is roughly right and one that is
     * confidently zero.
     */
    storeCommission: number;
    /** True while any provider charge in the period is a computed
     * estimate rather than a reported figure - which payouts always are. */
    providerEstimated: boolean;
    total: number;
  };
  /**
   * The rate card behind the release line, and what it actually yielded.
   *
   * The fees themselves have always been dynamic - they are recorded
   * revenue events written by `platform_fee_for()`, so whatever the
   * console sets is what the statement counts, without anything here
   * knowing the rates. What the statement could not do was EXPLAIN that
   * line, and now that the card is editable from a form it has to: a
   * card cut from 10% to 8% and a fortnight of fewer releases move this
   * number the same way, and telling them apart is the difference
   * between a pricing decision and a panic.
   *
   * `effectivePercent` is the realised rate over the period - fees over
   * the gross they were charged on - so it reflects the mix of Hustle
   * sizes as well as the card. It will not equal any single rung, and
   * that is the point.
   */
  releaseFee: {
    /** The card in force right now, not during the period. Stated as
     * such wherever it is shown. */
    tiers: FeeTier[];
    /** Value of the Hustles those fees were charged on. */
    gross: number;
    releases: number;
    /** Fees as a percentage of that gross. Null when nothing was
     * released, because zero would read as "we charged nothing". */
    effectivePercent: number | null;
    /** How many times the card was edited inside the period. Anything
     * above zero means the line below spans more than one price. */
    changesInPeriod: number;
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
  // Stamp duty over the same window. Only paid withdrawals: an unpaid one
  // has not been charged the duty either.
  let dutyQuery = supabase
    .from("withdrawals")
    .select("levy")
    .eq("status", "paid");
  if (from) dutyQuery = dutyQuery.gte("created_at", from);
  if (toEndMs !== null) {
    dutyQuery = dutyQuery.lt("created_at", new Date(toEndMs).toISOString());
  }

  let chargeQuery = supabase
    .from("provider_charges")
    .select("kind, amount, estimated");
  if (from) chargeQuery = chargeQuery.gte("created_at", from);
  if (toEndMs !== null) {
    chargeQuery = chargeQuery.lt("created_at", new Date(toEndMs).toISOString());
  }

  // The gross those release fees were charged on, counted over the same
  // window and the same revenue rows as the line above - see
  // `release_fee_stats` in 20260824235000_editable_fee_tiers.sql.
  const releaseStatsQuery = supabase.rpc("release_fee_stats", {
    p_from: from ? new Date(Date.parse(from)).toISOString() : null,
    p_to: toEndMs !== null ? new Date(toEndMs).toISOString() : null,
  });

  const [
    { data: revenueRows, error },
    { data: dutyRows },
    { data: chargeRows },
    costRows,
    { data: releaseStats },
    feeTiers,
    feeTierChanges,
  ] = await Promise.all([
    revenueQuery,
    dutyQuery,
    chargeQuery,
    listCosts(),
    releaseStatsQuery,
    listFeeTiers(),
    listFeeTierChanges(
      from,
      toEndMs !== null ? new Date(toEndMs).toISOString() : null
    ),
  ]);
  if (error) throw new Error(error.message);

  const releaseGross = Number(
    (releaseStats as { gross?: number } | null)?.gross ?? 0
  );
  const releaseCount = Number(
    (releaseStats as { releases?: number } | null)?.releases ?? 0
  );

  const stampDuty = (dutyRows ?? []).reduce(
    (sum, row) => sum + Number(row.levy ?? 0),
    0,
  );

  let providerDeposits = 0;
  let providerPayouts = 0;
  let storeCommission = 0;
  let providerEstimated = false;
  for (const row of chargeRows ?? []) {
    const amount = Number(row.amount);
    if (row.kind === "deposit") providerDeposits += amount;
    else if (row.kind === "payout") providerPayouts += amount;
    else if (row.kind === "store_commission") storeCommission += amount;
    if (row.estimated) providerEstimated = true;
  }

  let withdrawalFees = 0;
  let releaseFees = 0;
  let escrowFees = 0;
  let smsFees = 0;
  let featureFees = 0;
  let depositFees = 0;
  // Every kind is counted, and anything unrecognised still reaches the
  // total below. The old version summed three of five: release fees - the
  // main stream - and featured placements were both earned, recorded, and
  // then left out of the statement.
  for (const row of revenueRows ?? []) {
    const amount = Number(row.amount);
    if (row.kind === "withdrawal_fee") withdrawalFees += amount;
    else if (row.kind === "escrow_release_fee") releaseFees += amount;
    else if (row.kind === "escrow_refund_fee") escrowFees += amount;
    else if (row.kind === "sms_subscription") smsFees += amount;
    else if (row.kind === "skill_feature") featureFees += amount;
    else if (row.kind === "deposit_fee") depositFees += amount;
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

  const revenueTotal =
    withdrawalFees +
    releaseFees +
    escrowFees +
    smsFees +
    featureFees +
    depositFees;
  const costsTotal =
    oneOffs +
    recurringAccrued +
    providerDeposits +
    providerPayouts +
    storeCommission;

  return {
    from,
    to,
    presets: buildPresets(nowMs),
    revenue: {
      releaseFees: round(releaseFees),
      escrowFees: round(escrowFees),
      smsFees: round(smsFees),
      featureFees: round(featureFees),
      withdrawalFees: round(withdrawalFees),
      depositFees: round(depositFees),
      total: round(revenueTotal),
    },
    passThrough: {
      stampDuty: round(stampDuty),
    },
    releaseFee: {
      tiers: feeTiers,
      gross: round(releaseGross),
      releases: releaseCount,
      effectivePercent:
        releaseGross > 0
          ? Math.round((releaseFees / releaseGross) * 10000) / 100
          : null,
      changesInPeriod: feeTierChanges.length,
    },
    costs: {
      recurringAccrued: round(recurringAccrued),
      oneOffs: round(oneOffs),
      providerDeposits: round(providerDeposits),
      providerPayouts: round(providerPayouts),
      storeCommission: round(storeCommission),
      providerEstimated,
      total: round(costsTotal),
    },
    net: round(revenueTotal - costsTotal),
  };
}
