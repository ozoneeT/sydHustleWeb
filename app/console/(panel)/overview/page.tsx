import { StatCard } from "@/components/moderator/StatCard";
import { Card } from "@/components/ui/card";
import { getConsoleStats } from "@/lib/console/data";
import { naira } from "@/lib/console/format";

export const metadata = { title: "Overview — sydHustle Console" };

export default async function OverviewPage() {
  const stats = await getConsoleStats();

  const netFlow30d = stats.flows.money_in_30d - stats.flows.money_out_30d;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot taken {new Date(stats.generated_at).toLocaleString("en-NG")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          People
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Users" value={stats.users.total.toLocaleString()} />
          <StatCard
            label="New this week"
            value={stats.users.new_7d.toLocaleString()}
          />
          <StatCard
            label="Hustles paid out"
            value={stats.withdrawals.paid_count.toLocaleString()}
            hint="settled withdrawals"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profit &amp; loss
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Earned"
            value={naira(stats.revenue.total)}
            hint="mostly release fees — see Earnings"
          />
          <StatCard
            label="Money in (30d)"
            value={naira(stats.flows.money_in_30d)}
            hint="all wallet credits"
          />
          <StatCard
            label="Money out (30d)"
            value={naira(stats.flows.money_out_30d)}
            hint="all wallet debits"
          />
        </div>
        <Card className="p-5 text-sm text-muted-foreground">
          <p>
            Net wallet flow (30d):{" "}
            <span
              className={
                netFlow30d >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"
              }
            >
              {naira(Math.abs(netFlow30d))} {netFlow30d >= 0 ? "in" : "out"}
            </span>
            . Wallet flow is not revenue: a deposit is someone else&apos;s
            money arriving, and it leaves again on withdrawal. What
            sydHustle keeps is on{" "}
            <a className="underline" href="/console/earnings">
              Earnings
            </a>
            .
          </p>
          <p className="mt-2">
            True profit is fees earned minus provider charges, and those are
            still not recorded per transaction — Paystack takes 1% capped at
            ₦300 on transfers into virtual accounts, and ₦10/₦25/₦50 per
            payout by band. Read them off the provider dashboard until they
            are recorded here. Card checkout costs nothing: the payer bears
            that fee.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Money on the books
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Wallet liability"
            value={naira(stats.wallets.liability)}
            hint="what users hold — cash across Paystack, OPay and the bank must cover this"
          />
          <StatCard
            label="Locked in escrow"
            value={naira(stats.escrow.held_sum)}
            hint={`${stats.escrow.held_count} active holds (included in liability)`}
          />
          <StatCard
            label="Withdrawals in flight"
            value={naira(stats.withdrawals.in_flight_sum)}
            hint={`${stats.withdrawals.in_flight_count} pending or processing`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All-time flows
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Deposits"
            value={naira(stats.flows.deposits_total)}
            hint={`${naira(stats.flows.deposits_30d)} in the last 30 days`}
          />
          <StatCard
            label="Paid to Hustlers"
            value={naira(stats.escrow.released_sum)}
            hint="released escrow"
          />
          <StatCard
            label="Withdrawn to banks"
            value={naira(stats.withdrawals.paid_sum)}
          />
        </div>
      </section>
    </div>
  );
}
