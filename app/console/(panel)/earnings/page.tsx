import { EarningsSettingsForm } from "@/components/console/EarningsSettingsForm";
import { StatCard } from "@/components/moderator/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getConsoleStats, getPlatformSettings } from "@/lib/console/data";
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
          hint="4-10% of every released Hustle"
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
                    sydHustle&apos;s cut of every released Hustle
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
              {/* Only worth a row where it is not zero: withdrawals have
                  been free since the cut moved to releases, and a
                  permanent ₦0 line is noise on every statement after. */}
              {pnl.revenue.withdrawalFees > 0 ? (
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3">
                    Withdrawal fees
                    <span className="block text-xs text-muted-foreground">
                      charged before withdrawals became free
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
      </section>

      <div className="max-w-xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Rates
        </h2>
        <EarningsSettingsForm settings={settings} />
      </div>
    </div>
  );
}
