import { ReviewAppealDecision } from "@/components/console/ReviewAppealActions";
import { StatCard } from "@/components/moderator/StatCard";
import {
  APPEAL_GROUND_LABELS,
  APPEAL_GROUND_TESTS,
  listReviewAppeals,
  reviewerAppealHistory,
  type ReviewAppealRow,
} from "@/lib/console/review-appeals";
import { shortDate } from "@/lib/console/format";

export const metadata = { title: "Review appeals — sydHustle Console" };

// A pending queue is worthless cached.
export const dynamic = "force-dynamic";

export default async function ReviewAppealsPage() {
  const appeals = await listReviewAppeals();
  const history = await reviewerAppealHistory([
    ...new Set(appeals.map((row) => row.reviewer_id).filter(Boolean)),
  ]);

  const pending = appeals.filter((row) => row.status === "pending");
  const decided = appeals.filter((row) => row.status !== "pending");
  const upheld = decided.filter((row) => row.status === "upheld");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review appeals</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          A Hustler asking for a review about them to come down. The bar is a
          broken rule, not an unfair rating — a harsh review that is honest
          stays up, and the app offers them a public reply instead. Removal is
          permanent: the unique constraint means that reviewer can never write
          another for that job.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          <strong className="text-foreground">
            The review stays visible in the app while it sits here.
          </strong>{" "}
          That is deliberate — if appealing hid a review, every one-star would
          be appealed on the day it landed. It also means nothing is bleeding
          while you take the time to check, and equally that a genuinely
          abusive review is up until someone acts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Waiting"
          value={pending.length}
          hint="target: decided within 24h"
        />
        <StatCard label="Decided" value={decided.length} />
        <StatCard
          label="Upheld"
          value={
            decided.length === 0
              ? "—"
              : `${Math.round((upheld.length / decided.length) * 100)}%`
          }
          hint="a high rate means reviews aren't being moderated at write time"
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Waiting ({pending.length})
        </h2>
        <div className="rounded-xl border border-white/10">
          {pending.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nothing waiting.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((row) => (
                <AppealCard
                  key={row.id}
                  row={row}
                  reviewerHistory={history.get(row.reviewer_id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Decided ({decided.length})
        </h2>
        <div className="rounded-xl border border-white/10">
          {decided.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nothing decided yet.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {decided.map((row) => (
                <div className="space-y-2 p-4" key={row.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="text-sm">
                      {row.appellant_name ?? "—"} vs{" "}
                      {row.reviewer_name ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {APPEAL_GROUND_LABELS[row.ground] ?? row.ground} ·{" "}
                      {row.resolved_at ? shortDate(row.resolved_at) : "—"}
                    </span>
                  </div>
                  {row.decision_note ? (
                    <p className="text-xs text-muted-foreground">
                      {row.decision_note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AppealCard({
  row,
  reviewerHistory,
}: {
  row: ReviewAppealRow;
  reviewerHistory?: { appealed: number; upheld: number };
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-400">
          {APPEAL_GROUND_LABELS[row.ground] ?? row.ground}
        </span>
        <span className="text-xs text-muted-foreground">
          filed {shortDate(row.created_at)} · {row.review_kind}
          {row.skill_name ? ` · ${row.skill_name}` : ""}
        </span>
      </div>

      {/* What to actually check for this ground. The queue is only as
          consistent as the question each decision is measured against,
          and nobody remembers six different tests. */}
      <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Check: </strong>
        {APPEAL_GROUND_TESTS[row.ground] ?? "Does this break a review rule?"}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            The review — {row.reviewer_name ?? "unknown"}
          </p>
          <p className="text-sm">
            {"★".repeat(row.rating)}
            <span className="text-muted-foreground">
              {"★".repeat(5 - row.rating)}
            </span>
          </p>
          <p className="text-sm">
            {row.comment ?? (
              <span className="text-muted-foreground">
                No comment — a rating only.
              </span>
            )}
          </p>
          {reviewerHistory && reviewerHistory.appealed > 1 ? (
            <p className="text-xs text-amber-400">
              This reviewer has {reviewerHistory.appealed} appeals against them,{" "}
              {reviewerHistory.upheld} upheld.
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            The appeal — {row.appellant_name ?? "unknown"}
          </p>
          <p className="text-sm">{row.detail}</p>
          {row.reply_body ? (
            <p className="text-xs text-muted-foreground">
              They also replied publicly: “{row.reply_body}”
            </p>
          ) : null}
        </div>
      </div>

      <ReviewAppealDecision id={row.id} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "upheld"
      ? "bg-red-500/15 text-red-400"
      : status === "rejected"
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-white/10 text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-1 text-xs ${style}`}>
      {status === "upheld" ? "removed" : status === "rejected" ? "kept up" : status}
    </span>
  );
}
