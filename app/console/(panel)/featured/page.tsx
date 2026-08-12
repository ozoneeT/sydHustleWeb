import { BoostCancel, BoostRank } from "@/components/console/FeatureRowActions";
import { StatCard } from "@/components/moderator/StatCard";
import {
  clickThrough,
  isLive,
  listBoosts,
  listSmsUsage,
  PERIOD_DAYS,
  type BoostRow,
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

  const totalImpressions = live.reduce((sum, row) => sum + row.impressions, 0);
  const totalClicks = live.reduce((sum, row) => sum + row.clicks, 0);
  // The number that says whether the rotation is doing its job: with
  // an even spread every live boost is near the average, and a wide
  // gap means somebody is paying for exposure they are not getting.
  const leanest = live.length > 0
    ? Math.min(...live.map((row) => row.impressions))
    : 0;

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

        <p className="max-w-3xl text-sm text-muted-foreground">
          The carousel holds five at a time and a Featured promo banner can
          carry more, both drawn by <strong>deficit</strong> — how far below an
          equal share of exposure a listing sits. Everyone who paid rotates
          through; the least-served go first. Counters halve weekly so the
          measure stays about recent fairness rather than becoming a permanent
          record.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Boosted now"
            value={live.length}
            hint="subscriptions running"
          />
          <StatCard
            label="Impressions"
            value={totalImpressions.toLocaleString()}
            hint="across every live boost"
          />
          <StatCard
            label="Clicks"
            value={totalClicks.toLocaleString()}
            hint={
              totalImpressions > 0
                ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}% of impressions`
                : "none yet"
            }
          />
          <StatCard
            label="Least served"
            value={leanest.toLocaleString()}
            hint="impressions for the thinnest live boost"
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
                    <Exposure row={row} />
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
              head={[
                "Listing",
                "Hustler",
                "Period",
                "Ran until",
                "Seen",
                "Clicks",
                "Status",
              ]}
              rows={history.map((row) => [
                row.display_name ?? "—",
                row.hustler_name ?? "—",
                `${PERIOD_DAYS[row.period]}d`,
                shortDate(row.ends_at),
                row.impressions.toLocaleString(),
                row.clicks.toLocaleString(),
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

/**
 * What one boost has actually received.
 *
 * Four numbers rather than one, because they fail differently and the
 * rotation weights them differently: appearances says it was picked,
 * seconds says it was on screen, impressions says it was seen, clicks
 * says it worked. A high time with low impressions is a card that sat
 * behind a fold — which is exactly the case the rotation is built to
 * notice.
 */
function Exposure({ row }: { row: BoostRow }) {
  const ctr = clickThrough(row);
  return (
    <div className="min-w-[13rem] space-y-1 text-xs">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Metric label="shown" value={row.appearances.toLocaleString()} />
        <Metric label="seen" value={row.impressions.toLocaleString()} />
        <Metric label="clicks" value={row.clicks.toLocaleString()} />
        <Metric
          label="CTR"
          value={ctr === null ? "—" : `${(ctr * 100).toFixed(1)}%`}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>{Math.round(row.seconds_shown).toLocaleString()}s on screen</span>
        {/* sydHustle has no "like" — reviews are the nearest real
            signal, and they come from settled work, so they say more
            than a tap would. */}
        <span>
          {row.rating_count >= 3
            ? `★ ${row.rating_avg.toFixed(1)} · ${row.rating_count} reviews`
            : row.rating_count > 0
              ? `${row.rating_count} review${row.rating_count === 1 ? "" : "s"}`
              : "no reviews"}
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-foreground">{value}</span>{" "}
      <span className="text-muted-foreground">{label}</span>
    </span>
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
