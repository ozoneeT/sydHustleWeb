import { listWithdrawals } from "@/lib/console/data";
import { naira, settlementId, shortDate } from "@/lib/console/format";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Withdrawals — sydHustle Console" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  processing: "bg-sky-500/15 text-sky-400",
  failed: "bg-red-500/15 text-red-400",
  reversed: "bg-red-500/15 text-red-400",
};

export default async function WithdrawalsPage() {
  const rows = await listWithdrawals();
  const stuck = rows.filter((row) => row.queued_long);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
        <p className="text-sm text-muted-foreground">
          The last {rows.length} payout requests. Bank details stay here —
          never in exports.
        </p>
      </div>

      {stuck.length > 0 ? (
        <Card className="border-amber-500/30 p-4 text-sm">
          <p className="font-semibold text-amber-400">
            {stuck.length} withdrawal{stuck.length === 1 ? "" : "s"} queued for
            more than 5 minutes
          </p>
          <p className="mt-1 text-muted-foreground">
            Usually the Paystack Transfers balance can&apos;t cover them. Top
            it up — the retry loop sends queued withdrawals automatically
            within 10 minutes of funding.
          </p>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Settlement ID</th>
              <th className="px-4 py-3">Status</th>
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
                <td className="px-4 py-3 text-right font-mono">
                  {naira(row.amount)}
                  {/* What the bank was actually sent, whenever it differs.
                      The gap is stamp duty on transfers of ₦10,000 or
                      more, and "why is my transfer ₦50 short" is the
                      support question this column exists to answer. */}
                  {row.net !== row.amount ? (
                    <span className="block text-xs font-sans text-muted-foreground">
                      {naira(row.net)} sent
                      {row.levy > 0 ? ` · ${naira(row.levy)} duty` : ""}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.bank_name ?? "—"} ···
                  {row.account_number?.slice(-4) ?? "????"}
                  <span className="block text-xs">{row.account_name}</span>
                </td>
                {/* The number the caller is holding. When someone rings
                    saying a payout never landed, this is what their bank
                    will search on — every other identifier on this page is
                    ours and traces nothing outside sydHustle.

                    The provider's own reference sits under it, named, so
                    an operator who needs the OTHER conversation — the one
                    with Paystack or Payvessel rather than with the bank —
                    can see at a glance which desk to open. `title` carries
                    the unspaced value for copying into their support
                    form; the grouped one is for reading aloud. */}
                <td className="px-4 py-3 font-mono text-xs">
                  {row.session_id ? (
                    <span
                      className="select-all text-foreground"
                      title={row.session_id}
                    >
                      {settlementId(row.session_id)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {row.status === "pending" || row.status === "processing"
                        ? "awaiting rail"
                        : "—"}
                    </span>
                  )}
                  {/* The provider's reference is dropped when it IS the
                      session id, which on Payvessel it always is: their
                      transfer API returns no handle of its own, so both
                      columns hold the same string and printing it twice
                      shows one number as if it were two. The provider
                      name still shows, because that is the part an
                      operator actually needs from this line. */}
                  {row.provider ||
                  (row.provider_reference &&
                    row.provider_reference !== row.session_id) ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {row.provider_reference &&
                      row.provider_reference !== row.session_id ? (
                        <span className="select-all">
                          {row.provider_reference}
                          {row.provider ? " · " : ""}
                        </span>
                      ) : null}
                      {row.provider ? (
                        <span className="font-sans">{row.provider}</span>
                      ) : null}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[row.status] ?? "bg-white/10"
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.failure_reason ? (
                    <span className="mt-1 block max-w-60 text-xs text-muted-foreground">
                      {row.failure_reason}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                  No withdrawals yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
