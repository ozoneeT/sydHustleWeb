import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { naira, shortDate } from "@/lib/console/format";
import { getUserTransactions, REASON_LABELS } from "@/lib/console/transactions";

export const metadata = { title: "User ledger — sydHustle Console" };
export const dynamic = "force-dynamic";

/**
 * Level two: one person's ledger, newest first.
 *
 * Balance before and after is shown on every row rather than only the
 * running balance, because that pair is what makes a ledger auditable
 * from any single line: an entry whose "before" does not match the
 * previous entry's "after" is the one worth asking about.
 */
export default async function UserTransactionsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const { profile, entries } = await getUserTransactions(profileId);
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href="/console/transactions"
        >
          ← All users
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {profile.display_name ?? profile.id}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.email ?? "no email"} · joined {shortDate(profile.created_at)}{" "}
          · <span className="font-mono text-xs">{profile.id}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Balance
          </p>
          <p className="mt-1 text-xl font-semibold">
            {naira(Number(profile.balance ?? 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Held for review
          </p>
          <p className="mt-1 text-xl font-semibold">
            {naira(Number(profile.restricted ?? 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            NIN
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${profile.identity_verified ? "text-emerald-400" : "text-amber-400"}`}
          >
            {profile.identity_verified ? "Verified" : "Not verified"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            BVN
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${profile.bvn_verified ? "text-emerald-400" : "text-muted-foreground"}`}
          >
            {profile.bvn_verified ? "Verified" : "Not on file"}
          </p>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Before</th>
              <th className="px-4 py-3 text-right">After</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                className="border-b border-white/5 hover:bg-white/[0.02]"
                key={entry.id}
              >
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(entry.created_at)}
                </td>
                <td className="px-4 py-3">
                  {REASON_LABELS[entry.reason] ?? entry.reason}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${entry.direction === "credit" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {entry.direction === "credit" ? "+" : "−"}
                  {naira(Number(entry.amount))}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {naira(Number(entry.balance_before))}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(Number(entry.balance_after))}
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="font-mono text-xs underline-offset-4 hover:underline"
                    href={`/console/transactions/${profileId}/${entry.reference}`}
                  >
                    {entry.reference}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No wallet entries for this account.
        </p>
      ) : null}
    </div>
  );
}
