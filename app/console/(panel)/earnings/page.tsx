import { EarningsSettingsForm } from "@/components/console/EarningsSettingsForm";
import { FeeTiersForm } from "@/components/console/FeeTiersForm";
import { StatCard } from "@/components/moderator/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getConsoleStats, getPlatformSettings } from "@/lib/console/data";
import { summariseFeeTiers } from "@/lib/console/fee-tiers";
import { naira } from "@/lib/console/format";
import { getProfitAndLoss } from "@/lib/console/pnl";

export const metadata = { title: "Earnings — sydHustle Console" };

function NetValue({ value }: { value: number }) {
  return (
    <span className={value >= 0 ? "text-emerald-400" : "text-red-400"}>
      {value < 0 ? "−" : ""}
      {naira(Math.abs(value))}
    </span>
  );
}

export default async function EarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const [stats, settings, pnl] = await Promise.all([
    getConsoleStats(),
    getPlatformSettings(),
    getProfitAndLoss(from, to),
  ]);

  const periodLabel =
    pnl.from || pnl.to
      ? `${pnl.from ?? "the beginning"} → ${pnl.to ?? "today"}`
      : "All time — everything so far";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground">
          What sydHustle has earned, and the rates that earn it. Every naira
          here is a recorded revenue event, not an estimate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Earned all-time" value={naira(stats.revenue.total)} />
        <StatCard
          label="Last 30 days"
          value={naira(stats.revenue.total_30d)}
        />
        <StatCard
          label="Release fees"
          value={naira(stats.revenue.release_fees)}
          hint={`${summariseFeeTiers(pnl.releaseFee.tiers)} of every released Hustle`}
        />
        <StatCard
          label="Escrow service fees"
          value={naira(stats.revenue.escrow_fees)}
          hint="from dispute refunds"
        />
      </div>

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p>
          sydHustle earns when work is released, on a sliding rate by Hustle
          value. Withdrawals are free and the payout provider&apos;s transfer
          charge comes out of these fees, since we absorb it rather than bill
          users for it. Which provider that is, is set on{" "}
          <a className="underline" href="/console/payments">
            Payments
          </a>
          .
        </p>
        <p>
          <strong className="text-white">
            {naira(stats.levies.stamp_duty_collected)}
          </strong>{" "}
          of stamp duty has been collected from users and paid to government.
          It is not counted anywhere above: it passes straight through, so
          treating it as income would flatter the books by the whole amount.
        </p>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Profit &amp; loss
            </h2>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
          <form action="/console/earnings" className="flex flex-wrap items-end gap-2">
            <div className="flex gap-1">
              {pnl.presets.map((preset) => {
                const active =
                  pnl.from === preset.from && pnl.to === preset.to;
                return (
                  <a
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white/10 font-semibold text-white"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                    href={`/console/earnings?from=${preset.from}&to=${preset.to}`}
                    key={preset.label}
                  >
                    {preset.label}
                  </a>
                );
              })}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="from">
                From
              </label>
              <Input defaultValue={pnl.from ?? ""} id="from" name="from" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="to">
                To
              </label>
              <Input defaultValue={pnl.to ?? ""} id="to" name="to" type="date" />
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            {pnl.from || pnl.to ? (
              <a
                className="px-2 py-2 text-sm text-muted-foreground hover:underline"
                href="/console/earnings"
              >
                All time
              </a>
            ) : null}
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-white/10 bg-white/5">
                <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground" colSpan={2}>
                  Revenue
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">
                  Release fees
                  <span className="block text-xs text-muted-foreground">
                    {/* The realised rate, not a rung. It reflects the mix
                        of Hustle sizes as well as the card, so it is the
                        figure that says whether a rate change actually
                        did what it was meant to. */}
                    {pnl.releaseFee.effectivePercent !== null ? (
                      <>
                        {pnl.releaseFee.effectivePercent}% of{" "}
                        {naira(pnl.releaseFee.gross)} released across{" "}
                        {pnl.releaseFee.releases.toLocaleString("en-NG")}{" "}
                        {pnl.releaseFee.releases === 1 ? "Hustle" : "Hustles"}
                      </>
                    ) : (
                      <>sydHustle&apos;s cut of every released Hustle</>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.revenue.releaseFees)}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">Escrow service fees</td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.revenue.escrowFees)}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">SMS subscriptions</td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.revenue.smsFees)}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">Featured placements</td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.revenue.featureFees)}
                </td>
              </tr>
              {/* Both of these are zero unless the console has set a
                  rate, so they appear only when they carry a figure. A
                  permanent ₦0 line is noise on every statement. */}
              {pnl.revenue.depositFees > 0 ? (
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3">
                    Add-money fees
                    <span className="block text-xs text-muted-foreground">
                      our cut of deposits, on top of the provider&apos;s
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {naira(pnl.revenue.depositFees)}
                  </td>
                </tr>
              ) : null}
              {pnl.revenue.withdrawalFees > 0 ? (
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3">
                    Withdrawal fees
                    <span className="block text-xs text-muted-foreground">
                      what Hustlers paid to take money out
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {naira(pnl.revenue.withdrawalFees)}
                  </td>
                </tr>
              ) : null}
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-semibold">Total revenue</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {naira(pnl.revenue.total)}
                </td>
              </tr>

              <tr className="border-b border-white/10 bg-white/5">
                <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground" colSpan={2}>
                  Costs
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">
                  Recurring services
                  <span className="block text-xs text-muted-foreground">
                    prorated by day over the period each was running
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.costs.recurringAccrued)}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">
                  Provider charges on deposits
                  <span className="block text-xs text-muted-foreground">
                    as Paystack and Payvessel reported them
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.costs.providerDeposits)}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">
                  Provider charges on payouts
                  <span className="block text-xs text-muted-foreground">
                    computed from published transfer bands
                    {pnl.costs.providerEstimated ? " — estimated" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.costs.providerPayouts)}
                </td>
              </tr>
              {/* Only where it carries a figure. Store billing is new
                  and most periods have none. */}
              {pnl.costs.storeCommission > 0 ? (
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3">
                    Apple &amp; Google commission
                    <span className="block text-xs text-muted-foreground">
                      their cut of hustleBoost and SMS subscriptions —
                      estimated at the console&apos;s rate, since the true
                      figure is on their settlement report
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {naira(pnl.costs.storeCommission)}
                  </td>
                </tr>
              ) : null}
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">One-off spends</td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(pnl.costs.oneOffs)}
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-semibold">Total costs</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {naira(pnl.costs.total)}
                </td>
              </tr>

              {pnl.passThrough.stampDuty > 0 ? (
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3 text-muted-foreground">
                    Stamp duty collected and remitted
                    <span className="block text-xs text-muted-foreground">
                      passes through - in neither revenue nor costs
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {naira(pnl.passThrough.stampDuty)}
                  </td>
                </tr>
              ) : null}

              <tr className="bg-white/5">
                <td className="px-4 py-3 text-base font-bold">
                  Net {pnl.net >= 0 ? "profit" : "loss"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-base font-bold">
                  <NetValue value={pnl.net} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {pnl.releaseFee.changesInPeriod > 0 ? (
          <p className="text-xs text-amber-400">
            The release fee card was changed{" "}
            {pnl.releaseFee.changesInPeriod === 1
              ? "once"
              : `${pnl.releaseFee.changesInPeriod} times`}{" "}
            inside this period, so the release line above spans more than
            one price and the rate beside it is an average across them.
          </p>
        ) : null}
      </section>

      <div className="max-w-xl space-y-8">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Rates
          </h2>
          {/* The release card first: it is the main revenue line, and
              every other rate on this page is set against what it
              earns. */}
          <FeeTiersForm tiers={pnl.releaseFee.tiers} />
        </div>
        <EarningsSettingsForm settings={settings} />
      </div>
    </div>
  );
}
