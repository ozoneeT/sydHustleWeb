import { ReportDecision } from "@/components/console/ReportDecision";
import { ReportEnforcement } from "@/components/console/ReportEnforcement";
import { StatCard } from "@/components/moderator/StatCard";
import { shortDate } from "@/lib/console/format";
import {
  listReports,
  REPORT_REASON_LABELS,
  URGENT_REASONS,
  type ReportRow,
} from "@/lib/console/reports";

export const metadata = { title: "Reports — sydHustle Console" };

// A pending queue is worthless cached.
export const dynamic = "force-dynamic";

const TARGET_LABELS: Record<string, string> = {
  message: "Message",
  profile: "Profile",
  hustle: "Hustle",
  skill: "Skill",
  review: "Review",
  conversation: "Conversation",
};

/** A conversation has nothing to take down on its own — its messages
 * are each reportable, and removing a thread wholesale would hide both
 * sides of an argument. Mirrors `enforce_report`. */
const REMOVABLE = new Set(["skill", "hustle", "message", "review"]);

type Search = { status?: string; type?: string };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { status = "pending", type = "all" } = await searchParams;
  const all = await listReports();

  const pending = all.filter((r) => r.status === "pending");
  const urgent = pending.filter((r) => URGENT_REASONS.has(r.reason));
  const oldest = pending.at(-1);

  const rows = all.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (type === "all" || r.target_type === type)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Someone in the app pressing &ldquo;Report this&rdquo;. Not to be
          confused with <strong className="text-foreground">Moderation</strong>,
          which is the automatic filter&rsquo;s log — that content was already
          blocked or flagged on its way in.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          <strong className="text-foreground">
            Everything below is live in the app right now
          </strong>{" "}
          and stays live until somebody acts. Every action here tells the person
          what happened and why — by push and by email, in your words — so write
          the reason as something you would be happy for them to read, because
          they will.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          hint="target: reviewed within 24h"
          label="Waiting"
          value={pending.length}
        />
        <StatCard
          hint="harassment, hate, illegal, explicit"
          label="Urgent waiting"
          value={urgent.length}
        />
        <StatCard
          hint={oldest ? shortDate(oldest.created_at) : undefined}
          label="Oldest waiting"
          value={oldest ? age(oldest.created_at) : "—"}
        />
      </div>

      <Filters
        counts={countBy(all)}
        status={status}
        total={all.length}
        type={type}
      />

      <div className="rounded-xl border border-white/10">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {all.length === 0
              ? "No reports have ever been filed."
              : "Nothing matches that filter."}
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((row) => (
              <ReportCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ row }: { row: ReportRow }) {
  const urgent = URGENT_REASONS.has(row.reason) && row.status === "pending";

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            urgent
              ? "bg-red-500/15 text-red-400"
              : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {REPORT_REASON_LABELS[row.reason] ?? row.reason}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
          {TARGET_LABELS[row.target_type] ?? row.target_type}
        </span>
        <StatusBadge status={row.status} />
        <span className="text-xs text-muted-foreground">
          filed {shortDate(row.created_at)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            What was reported
          </p>
          <p className="text-sm">
            {row.target_label ?? (
              <span className="text-muted-foreground">
                Gone — the {TARGET_LABELS[row.target_type]?.toLowerCase()} has
                been deleted since.
              </span>
            )}
          </p>
          {row.content_snapshot &&
          row.content_snapshot !== row.target_label ? (
            <p className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-xs text-muted-foreground">
              Snapshot at report time: {row.content_snapshot}
            </p>
          ) : null}
          {/* The exact row, not just a description of it. A moderator
              about to close somebody's account needs to be able to
              prove they are looking at the right one, and a display
              name is neither unique nor stable. */}
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.target_type}:{row.target_id}
          </p>
          {row.owner_name ? (
            <div className="space-y-0.5 pt-1">
              <p className="text-xs text-muted-foreground">
                Posted by{" "}
                <a
                  className="text-foreground underline decoration-white/20 underline-offset-2"
                  href={`/console/users?q=${encodeURIComponent(row.owner_email ?? row.owner_name)}`}
                >
                  {row.owner_name}
                </a>
                {row.owner_total > 1 ? (
                  <span className="text-amber-400">
                    {" "}
                    · {row.owner_total} reports against them
                  </span>
                ) : null}
              </p>
              {row.owner_email ? (
                <p className="font-mono text-[11px] text-muted-foreground">
                  {row.owner_email}
                </p>
              ) : null}
              <p className="font-mono text-[11px] text-muted-foreground">
                account:{row.owner_id}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            The report — {row.reporter_name ?? "unknown"}
          </p>
          <p className="text-sm">
            {row.detail ?? (
              <span className="text-muted-foreground">
                No detail given — the reason only.
              </span>
            )}
          </p>
          {row.reporter_total > 2 ? (
            <p className="text-xs text-amber-400">
              This person has filed {row.reporter_total} reports.
            </p>
          ) : null}
        </div>
      </div>

      {row.decision_note ? (
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> {row.decision_note}
        </p>
      ) : null}

      {row.owner_id ? (
        <ReportEnforcement
          inFlight={row.owner_in_flight}
          ownerName={row.owner_name}
          removable={REMOVABLE.has(row.target_type)}
          reportId={row.id}
          suspendedUntil={row.owner_suspended_until}
          targetType={row.target_type}
          terminatedAt={row.owner_terminated_at}
        />
      ) : null}

      {/* Closing without acting — the report was nothing, or it was
          handled somewhere else. Enforcement above already closes the
          report as part of doing the thing. */}
      <ReportDecision id={row.id} status={row.status} />
    </div>
  );
}

function Filters({
  status,
  type,
  counts,
  total,
}: {
  status: string;
  type: string;
  counts: Record<string, number>;
  total: number;
}) {
  const statuses = ["pending", "reviewed", "actioned", "dismissed", "all"];
  const types = ["all", ...Object.keys(TARGET_LABELS)];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statuses.map((value) => (
          <a
            className={`rounded-full px-3 py-1 text-xs ${
              status === value
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
            href={`/console/reports?status=${value}&type=${type}`}
            key={value}
          >
            {value === "all" ? `All (${total})` : `${value} (${counts[value] ?? 0})`}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((value) => (
          <a
            className={`rounded-full px-3 py-1 text-xs ${
              type === value
                ? "bg-white/15 text-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
            href={`/console/reports?status=${status}&type=${value}`}
            key={value}
          >
            {value === "all" ? "Every type" : TARGET_LABELS[value]}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "actioned"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "dismissed"
        ? "bg-white/10 text-muted-foreground"
        : status === "reviewed"
          ? "bg-sky-500/15 text-sky-400"
          : "bg-amber-500/15 text-amber-400";
  return (
    <span className={`rounded-full px-2 py-1 text-xs ${style}`}>{status}</span>
  );
}

function countBy(rows: ReportRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

/** How long something has been waiting, which is the number that
 * actually matters in a queue with an SLA attached to it. */
function age(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "<1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
