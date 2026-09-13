import { ContributionComposer } from "@/components/team/ContributionComposer";
import { MediaGrid } from "@/components/team/MediaGrid";
import { StatusPill } from "@/components/team/StatusPill";
import { WithdrawButton } from "@/components/team/WithdrawButton";
import { StatCard } from "@/components/ui/stat-card";
import { requireMember } from "@/lib/team/dal";
import {
  listContributionsFor,
  summarizeContributions,
} from "@/lib/team/data";
import { categoryLabel } from "@/lib/team/media";
import {
  formatDay,
  formatHours,
  ledgerToday,
  memberLabel,
} from "@/lib/team/format";

export const metadata = { title: "Your contributions — sydHustle" };

/**
 * One member's ledger: what they've claimed, what has been counted, and
 * the form for adding to it.
 *
 * It is one screen on purpose. The people using this are writing up an
 * evening's work on a phone, and a dashboard that makes them navigate to
 * find the box they came to type in is a dashboard that stops getting
 * used — at which point there is no record to divide anything by.
 */
export default async function TeamDashboardPage() {
  const member = await requireMember();
  const contributions = await listContributionsFor(member.id);
  const totals = summarizeContributions(contributions);

  const today = ledgerToday();
  const firstName = memberLabel(member).split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you post here is kept against your name. Nothing is paid
          out yet — this is the record that decides what you&apos;re owed when
          sydHustle starts earning.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          hint="approved and on the record"
          label="Counted"
          value={totals.approved}
        />
        <StatCard
          hint="posted, not yet checked"
          label="Waiting"
          value={totals.pending}
        />
        <StatCard
          hint="across everything approved"
          label="Credited hours"
          value={formatHours(totals.creditedHours)}
        />
      </div>

      <ContributionComposer today={today} />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your entries
        </h2>

        {contributions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Write up the last thing you worked on — even a
            couple of lines is better than trying to remember it later.
          </p>
        ) : (
          <ul className="space-y-4">
            {contributions.map((entry) => (
              <li
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                key={entry.id}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tight">{entry.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDay(entry.occurred_on)} ·{" "}
                      {categoryLabel(entry.category)}
                      {entry.hours !== null && ` · you logged ${formatHours(entry.hours)}`}
                    </p>
                  </div>
                  <StatusPill status={entry.status} />
                </div>

                {entry.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {entry.body}
                  </p>
                ) : null}

                {entry.media.length > 0 && (
                  <div className="mt-4">
                    <MediaGrid media={entry.media} />
                  </div>
                )}

                {entry.status === "approved" && (
                  <p className="mt-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-xs text-accent">
                    Counted at {formatHours(entry.credited_hours)}
                    {entry.review_note ? ` — ${entry.review_note}` : ""}
                  </p>
                )}

                {entry.status === "rejected" && (
                  <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                    Not counted{entry.review_note ? ` — ${entry.review_note}` : "."}
                  </p>
                )}

                {entry.status === "pending" && (
                  <div className="mt-4">
                    <WithdrawButton contributionId={entry.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
