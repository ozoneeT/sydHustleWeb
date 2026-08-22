import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { naira, shortDate } from "@/lib/console/format";
import { listTransactionUsers } from "@/lib/console/transactions";

export const metadata = { title: "Transactions — sydHustle Console" };

/** A live view of the money. Never a snapshot of the last deploy. */
export const dynamic = "force-dynamic";

/**
 * Level one: everyone who has moved money.
 *
 * The page used to be a flat list of the last hundred ledger entries,
 * which answers "is money moving" and nothing else. An enquiry arrives
 * naming a PERSON or quoting ONE reference, so the search takes both —
 * a name, an email, a profile id, or any of the three references a
 * transaction carries, which lands you on the owner of that entry.
 */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await listTransactionUsers(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Everyone who has moved money, most recent first. Open a person for
            their full ledger, and any entry for the complete record of that
            movement — the ledger is append-only, so this is the money&apos;s
            actual history rather than a report about it.
          </p>
        </div>
        <form action="/console/transactions" className="flex gap-2">
          <Input
            className="w-72"
            defaultValue={q ?? ""}
            name="q"
            placeholder="Name, email, profile id, or any reference…"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {q ? `Nothing matches “${q}”.` : "No wallet activity yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Entries</th>
                <th className="px-4 py-3 text-right">In</th>
                <th className="px-4 py-3 text-right">Out</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Last movement</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                  key={user.profile_id}
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/console/transactions/${user.profile_id}`}
                    >
                      {user.display_name ?? user.profile_id}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {user.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {user.entries}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {naira(Number(user.total_in))}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400">
                    {naira(Number(user.total_out))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {naira(Number(user.balance ?? 0))}
                    {Number(user.restricted ?? 0) > 0 ? (
                      <div className="text-xs text-amber-400">
                        {naira(Number(user.restricted))} held
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {shortDate(user.last_at)}
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
