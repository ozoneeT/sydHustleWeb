import Link from "next/link";

import { ContributionDecision } from "@/components/console/ContributionDecision";
import { MediaGrid } from "@/components/team/MediaGrid";
import { requireConsole } from "@/lib/console/dal";
import { shortDate } from "@/lib/console/format";
import {
  contributionCounts,
  listContributionsForReview,
  type ContributionStatus,
} from "@/lib/team/data";
import { categoryLabel } from "@/lib/team/media";
import { formatDay, formatHours, memberLabel } from "@/lib/team/format";
import { formatPhone } from "@/lib/team/phone";
import { cn } from "@/lib/utils";

export const metadata = { title: "Contributions — sydHustle Console" };

const FILTERS: { key: ContributionStatus; label: string }[] = [
  { key: "pending", label: "To check" },
  { key: "approved", label: "Counted" },
  { key: "rejected", label: "Turned down" },
];

function isStatus(value: string | undefined): value is ContributionStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

/**
 * The review queue.
 *
 * Nothing a member posts counts until it is approved here, and what is
 * approved here is what a share of the company will eventually be divided
 * by — so the queue shows the whole claim, evidence included, rather than a
 * row to tick. Pending comes up oldest first: nobody's write-up should sink
 * out of sight because three people posted after them.
 *
 * A decided entry can be revisited. People approve the wrong row, and a
 * rejection sometimes turns out to be a misunderstanding, so the decision
 * form stays on approved and rejected entries too.
 */
export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireConsole("contributions");

  const { status: raw } = await searchParams;
  const status: ContributionStatus = isStatus(raw) ? raw : "pending";

  const [entries, counts] = await Promise.all([
    listContributionsForReview(status),
    contributionCounts(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contributions</h1>
        <p className="text-sm text-muted-foreground">
          What the members say they&apos;ve done. Nothing counts towards
          anyone&apos;s share until it&apos;s approved here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              filter.key === status
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            )}
            href={`/console/contributions?status=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
            <span className="opacity-60">{counts[filter.key]}</span>
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-muted-foreground">
          {status === "pending"
            ? "Nothing waiting. The queue is clear."
            : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              key={entry.id}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold tracking-tight">{entry.title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {/* A claim always has a name on it: only a signed-up
                        member can post, and signup demands one. The phone
                        is shown beside it as the thing that identifies the
                        account, and is not repeated when it IS the name. */}
                    <span className="text-foreground">
                      {memberLabel(entry.member)}
                    </span>
                    {entry.member.name ? (
                      <>
                        {" "}
                        <span className="font-mono">
                          {formatPhone(entry.member.phone)}
                        </span>
                      </>
                    ) : null}{" "}
                    · {formatDay(entry.occurred_on)} ·{" "}
                    {categoryLabel(entry.category)}
                  </p>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <p>
                    Claimed{" "}
                    <span className="font-medium text-foreground">
                      {formatHours(entry.hours)}
                    </span>
                  </p>
                  <p className="mt-0.5">posted {shortDate(entry.created_at)}</p>
                </div>
              </div>

              {entry.body ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {entry.body}
                </p>
              ) : (
                // Said out loud rather than left as a gap: a reviewer
                // needs to know they are looking at everything there is.
                <p className="text-sm italic text-muted-foreground">
                  No write-up — the title is all they posted.
                </p>
              )}

              <MediaGrid media={entry.media} />

              {entry.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  {entry.status === "approved"
                    ? `Credited ${formatHours(entry.credited_hours)}`
                    : "Turned down"}{" "}
                  by {entry.reviewed_by ?? "someone"} on{" "}
                  {shortDate(entry.reviewed_at)}
                  {entry.review_note ? ` — “${entry.review_note}”` : ""}
                </p>
              )}

              <ContributionDecision
                claimedHours={entry.hours}
                contributionId={entry.id}
                currentCredited={entry.credited_hours}
                currentNote={entry.review_note}
                currentStatus={entry.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
