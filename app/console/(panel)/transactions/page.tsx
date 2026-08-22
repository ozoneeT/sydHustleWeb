import { listRecentLedger } from "@/lib/console/data";
import { naira, settlementId, shortDate } from "@/lib/console/format";

export const metadata = { title: "Transactions — sydHustle Console" };

const REASON_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  withdrawal_refund: "Withdrawal refund",
  withdrawal_reversal: "Withdrawal refund",
  escrow_hold: "Escrow lock",
  escrow_release: "Escrow release",
  escrow_refund: "Escrow refund",
};

export default async function TransactionsPage() {
  const rows = await listRecentLedger();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          The last {rows.length} wallet ledger entries, newest first. The
          ledger is append-only — this is the money&apos;s actual history.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Provider reference</th>
              <th className="px-4 py-3">Settlement ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-white/5" key={row.id}>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(row.created_at)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {row.profile_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {REASON_LABELS[row.reason] ?? row.reason}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
                    row.direction === "credit"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {row.direction === "credit" ? "+" : "−"}
                  {naira(row.amount)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {row.reference ?? "—"}
                </td>
                {/* What a DEPOSIT is traced by, and the provider whose
                    desk resolves it. Named here and nowhere in the app:
                    an operator holding this reference still has to know
                    whether to open Paystack or Payvessel, and the user
                    never does. */}
                <td className="px-4 py-3 font-mono text-xs">
                  {row.provider_reference ? (
                    <span
                      className="select-all text-foreground"
                      title={row.provider_reference}
                    >
                      {row.provider_reference}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {row.provider ? (
                    <span className="mt-1 block font-sans text-[11px] text-muted-foreground">
                      {row.provider}
                    </span>
                  ) : null}
                </td>
                {/* What a WITHDRAWAL is traced by, out at the bank. Blank
                    on everything else, and correctly so: a top-up never
                    settled under our instruction, and an escrow lock or
                    release moved money between two sydHustle wallets that
                    no bank rail ever saw. */}
                <td className="px-4 py-3 font-mono text-xs">
                  {row.settlement_id ? (
                    <span
                      className="select-all text-foreground"
                      title={row.settlement_id}
                    >
                      {settlementId(row.settlement_id)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                  No transactions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
