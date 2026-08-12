import { BoostCancel, BoostRank } from "@/components/console/FeatureRowActions";
import { StatCard } from "@/components/moderator/StatCard";
import {
  isLive,
  listBoosts,
  listSmsUsage,
  PERIOD_DAYS,
  type SmsUsageRow,
} from "@/lib/console/featured";
import { shortDate } from "@/lib/console/format";

export const metadata = { title: "Subscriptions — sydHustle Console" };

// Subscriptions change the moment a store charges someone; never cached.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  expired: "bg-white/10 text-muted-foreground",
  cancelled: "bg-red-500/15 text-red-400",
};

export default async function SubscriptionsPage() {
  const [boosts, smsUsage] = await Promise.all([listBoosts(), listSmsUsage()]);

  const live = boosts.filter(isLive);
  const history = boosts.filter((row) => !isLive(row));

  const smsLive = smsUsage.filter((row) => row.status === "active");
  const atCap = smsLive.filter((row) => row.used_this_period >= row.cap);
  const totalSent = smsUsage.reduce((sum, row) => sum + row.sent_all_time, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          The two things sydHustle sells: <strong>hustleBoost</strong>, which
          lifts a Skill into the Featured carousel and up its rail, and{" "}
          <strong>SMS alerts</strong>. Both are billed by Apple and Google — the
          wallet is never charged for either, and refunds are theirs to issue,
          not ours.
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">hustleBoost</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Boosted now"
            value={live.length}
            hint="cards in the carousel"
          />
          <StatCard
            label="Ever run"
            value={boosts.length}
            hint="including finished and pulled"
          />
        </div>

        <Panel title={`Running now (${live.length})`}>
          {live.length === 0 ? (
            <Empty>
              Nothing boosted, so the carousel is hidden in the app right now.
            </Empty>
          ) : (
            <div className="divide-y divide-white/5">
              {[...live]
                .sort((a, b) => a.rank - b.rank)
                .map((row) => (
                  <div className="flex flex-wrap items-center gap-4 p-4" key={row.id}>
                    <Cover row={row} />
                    <div className="min-w-[14rem] flex-1 space-y-1">
                      <p className="font-medium">{row.display_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.skill_name ?? "—"} · {row.hustler_name ?? "unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PERIOD_DAYS[row.period]}-day period · ends{" "}
                        {shortDate(row.ends_at)}
                      </p>
                    </div>
                    <BoostRank id={row.id} rank={row.rank} />
                    <BoostCancel id={row.id} />
                  </div>
                ))}
            </div>
          )}
        </Panel>

        <Panel title={`History (${history.length})`}>
          {history.length === 0 ? (
            <Empty>Nothing finished yet.</Empty>
          ) : (
            <Table
              head={["Listing", "Hustler", "Period", "Ran until", "Status"]}
              rows={history.map((row) => [
                row.display_name ?? "—",
                row.hustler_name ?? "—",
                `${PERIOD_DAYS[row.period]}d`,
                shortDate(row.ends_at),
                <Badge key="s" status={row.status} note={row.cancel_reason} />,
              ])}
            />
          )}
        </Panel>
      </section>

      {/* ---------------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">SMS alerts</h2>
          <p className="text-sm text-muted-foreground">
            ₦300/week capped at 20 texts, ₦700/month capped at 60. Those numbers
            are a guess until this table has data in it — read real consumption
            here before changing either the cap or the price. Someone who hits
            their cap keeps getting the booking, as a push instead of a text.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active subscribers" value={smsLive.length} />
          <StatCard
            label="At their cap"
            value={atCap.length}
            hint="getting pushes instead of texts"
          />
          <StatCard
            label="Texts sent, all time"
            value={totalSent}
            hint="what the SMS bill is driven by"
          />
        </div>

        <Panel title={`Usage by subscriber (${smsUsage.length})`}>
          {smsUsage.length === 0 ? (
            <Empty>No SMS subscribers yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Subscriber</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">This period</th>
                    <th className="px-4 py-3">Renews</th>
                    <th className="px-4 py-3">All time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {smsUsage.map((row) => (
                    <tr className="border-b border-white/5" key={row.profile_id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.full_name ?? "—"}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {row.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.plan}
                      </td>
                      <td className="px-4 py-3">
                        <UsageBar row={row} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.auto_renew
                          ? shortDate(row.current_period_end)
                          : "not renewing"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.sent_all_time} sent
                        {row.failed_all_time > 0 ? (
                          <span className="text-red-400">
                            {" "}
                            · {row.failed_all_time} failed
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

/** Used against cap, as a number and a bar — the bar is what makes an
 * outlier findable by scrolling rather than by reading every row. */
function UsageBar({ row }: { row: SmsUsageRow }) {
  const pct = row.cap > 0 ? Math.min(100, (row.used_this_period / row.cap) * 100) : 0;
  const full = row.used_this_period >= row.cap;
  return (
    <div className="min-w-[7rem] space-y-1">
      <p className={full ? "text-xs text-amber-400" : "text-xs"}>
        {row.used_this_period} / {row.cap}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${full ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Badge({ status, note }: { status: string; note?: string | null }) {
  return (
    <>
      <span
        className={`rounded-full px-2 py-1 text-xs ${
          STATUS_STYLES[status] ?? "bg-white/10 text-muted-foreground"
        }`}
      >
        {status}
      </span>
      {note ? (
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      ) : null}
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="rounded-xl border border-white/10">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-4 text-sm text-muted-foreground">{children}</p>;
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((cell) => (
              <th className="px-4 py-3" key={cell}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, index) => (
            // Row order is stable within a render and the table is
            // read-only, so the index is a fine key here.
            <tr className="border-b border-white/5" key={index}>
              {cells.map((cell, cellIndex) => (
                <td className="px-4 py-3" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cover({
  row,
}: {
  row: { cover_photo: string | null; display_name: string | null };
}) {
  if (!row.cover_photo) {
    return <div className="h-16 w-16 shrink-0 rounded-lg bg-white/5" />;
  }
  return (
    // Plain <img>: covers are Supabase Storage URLs on a host that isn't in
    // next.config's image domains, and adding one for console thumbnails
    // isn't worth the config surface.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={row.display_name ?? "Listing cover"}
      className="h-16 w-16 shrink-0 rounded-lg object-cover"
      src={row.cover_photo}
    />
  );
}
