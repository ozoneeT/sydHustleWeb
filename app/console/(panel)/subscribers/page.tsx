import { StatCard } from "@/components/moderator/StatCard";
import { listSubscribers } from "@/lib/console/data";
import { naira, shortDate } from "@/lib/console/format";

export const metadata = { title: "Subscribers — sydHustle Console" };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  expired: "bg-amber-500/15 text-amber-400",
  cancelled: "bg-white/10 text-muted-foreground",
};

export default async function SubscribersPage() {
  const rows = await listSubscribers();

  const live = rows.filter((row) => row.live);
  const ending = live.filter((row) => !row.auto_renew);
  // What a full cycle of the current book is worth, normalised to a
  // month so the three plans can be compared at all.
  const monthlyValue = live.reduce((sum, row) => {
    if (row.plan === "daily") return sum + 30;
    if (row.plan === "weekly") return sum + 30 / 7;
    return sum + 1;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SMS subscribers</h1>
        <p className="text-sm text-muted-foreground">
          Hustlers paying for offline booking alerts. Revenue from these
          shows on the Earnings page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active now" value={live.length} />
        <StatCard
          label="Not renewing"
          value={ending.length}
          hint="auto-renew switched off"
        />
        <StatCard
          label="Billing cycles / month"
          value={Math.round(monthlyValue)}
          hint="daily plans bill ~30× a month, weekly ~4×"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Hustler</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Renews / ends</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-white/5" key={row.profile_id}>
                <td className="px-4 py-3 font-medium">
                  {row.profile_name ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {row.phone}
                </td>
                <td className="px-4 py-3 capitalize">
                  {row.plan}
                  {row.pending_plan ? (
                    <span className="block text-xs text-sky-400">
                      → {row.pending_plan}
                      {row.pending_prepaid_amount != null
                        ? ` (${naira(row.pending_prepaid_amount)} prepaid)`
                        : ""}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(row.current_period_end)}
                  {!row.auto_renew ? (
                    <span className="block text-xs text-amber-400">
                      auto-renew off
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[row.status] ?? "bg-white/10"
                    }`}
                  >
                    {row.live ? "active" : row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(row.created_at)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  Nobody has subscribed yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
