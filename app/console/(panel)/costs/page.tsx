import { CostForm } from "@/components/console/CostForm";
import { CostRowActions } from "@/components/console/CostRowActions";
import { StatCard } from "@/components/moderator/StatCard";
import { getCostSheet, type CostRow } from "@/lib/console/costs";
import { naira } from "@/lib/console/format";

export const metadata = { title: "Costs — sydHustle Console" };

function costLine(row: CostRow): string {
  const entered =
    row.currency === "USD"
      ? `$${row.amount.toLocaleString()} @ ₦${row.fx_rate?.toLocaleString()}`
      : null;
  return entered ? `${naira(row.amount_ngn)} (${entered})` : naira(row.amount_ngn);
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ rows, summary }, { edit }] = await Promise.all([
    getCostSheet(),
    searchParams,
  ]);

  const recurring = rows.filter((row) => row.kind === "recurring");
  const oneOffs = rows.filter((row) => row.kind === "one_off");
  const editing = edit ? (rows.find((row) => row.id === edit) ?? null) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Costs</h1>
        <p className="text-sm text-muted-foreground">
          Everything it takes to run sydHustle — services, maintenance,
          promotion. Dollar costs are converted at the rate you paid and
          frozen in naira.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total costs so far"
          value={naira(summary.totalAllTime)}
          hint="one-off spends + services accrued"
        />
        <StatCard
          label="Monthly run rate"
          value={naira(summary.monthlyRunRate)}
          hint="active services, yearly plans spread across 12"
        />
        <StatCard
          label="Costs (30d)"
          value={naira(summary.total30d)}
          hint="run rate + one-off spends this month"
        />
        <StatCard
          label="One-off spend, all-time"
          value={naira(summary.oneOffsTotal)}
        />
        <StatCard
          label="Services accrued, all-time"
          value={naira(summary.recurringAccrued)}
          hint="estimated from each service's start date"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recurring services
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <tbody>
                  {recurring.map((row) => (
                    <tr className="border-b border-white/5" key={row.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium">{row.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.category} · {row.cycle} · since {row.started_on}
                          {row.active ? "" : ` — stopped ${row.ended_on}`}
                          {row.note ? ` · ${row.note}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {costLine(row)}
                        <span className="block text-muted-foreground">
                          /{row.cycle === "yearly" ? "yr" : "mo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <CostRowActions
                          active={row.active}
                          id={row.id}
                          kind={row.kind}
                        />
                      </td>
                    </tr>
                  ))}
                  {recurring.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground">
                        No services yet — add Supabase, EAS, your domain…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              One-off spends
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <tbody>
                  {oneOffs.map((row) => (
                    <tr className="border-b border-white/5" key={row.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium">{row.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.category} · {row.spent_on}
                          {row.note ? ` · ${row.note}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {costLine(row)}
                      </td>
                      <td className="px-4 py-3">
                        <CostRowActions
                          active={row.active}
                          id={row.id}
                          kind={row.kind}
                        />
                      </td>
                    </tr>
                  ))}
                  {oneOffs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground">
                        No one-off spends recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {editing ? `Edit — ${editing.name}` : "Add a cost"}
          </h2>
          {/* Keyed so switching between rows (or back to adding) resets
              every field to the right starting values. */}
          <CostForm initial={editing ?? undefined} key={editing?.id ?? "new"} />
        </div>
      </div>
    </div>
  );
}
