import Link from "next/link";

import { Card } from "@/components/ui/card";
import { listAppeals } from "@/lib/console/appeals";
import { naira, shortDate } from "@/lib/console/format";

export const metadata = { title: "Appeals — sydHustle Console" };

export default async function AppealsPage() {
  const rows = await listAppeals();
  const open = rows.filter((row) => !row.resolvedAt);
  const held = open.reduce((sum, row) => sum + (row.escrowHeld ? row.amount : 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appeals</h1>
        <p className="text-sm text-muted-foreground">
          Disputes where one side says the work wasn&apos;t done and the other
          disagrees. The money stays frozen until someone here decides.
        </p>
      </div>

      {open.length > 0 ? (
        <Card className="border-amber-500/30 p-4 text-sm">
          <p className="font-semibold text-amber-400">
            {open.length} appeal{open.length === 1 ? "" : "s"} waiting —{" "}
            {naira(held)} held
          </p>
          <p className="mt-1 text-muted-foreground">
            Oldest first. Nothing in the app can settle these; escrow stays
            frozen for both sides until a decision is recorded.
          </p>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No appeals. Nothing is waiting on a decision.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">What</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Hustler</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Appealed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="border-b border-white/5 hover:bg-white/5"
                  key={`${row.kind}:${row.id}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-mono text-xs text-accent hover:underline"
                      href={`/console/appeals/${row.kind}/${row.id}`}
                    >
                      {row.id.slice(0, 8)}
                    </Link>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">
                      {row.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.providerName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.hustlerName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {naira(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {shortDate(row.appealedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {row.resolvedAt ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                        paid {row.awardedTo}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
                        {row.escrowHeld ? "held" : "open"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
