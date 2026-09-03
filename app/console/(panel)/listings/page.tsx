import Link from "next/link";

import { ListingCard } from "@/components/console/SkillListings";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getListingCounts,
  listSkillListings,
  PAGE_SIZE,
  type ListingState,
} from "@/lib/console/listings";

export const metadata = { title: "Listings — sydHustle Console" };

/** A moderation queue is worthless cached. */
export const dynamic = "force-dynamic";

type Search = { q?: string; state?: string; before?: string; id?: string };

const STATES: { id: ListingState; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "suspended", label: "Needs info" },
  { id: "removed", label: "Removed" },
];

function isState(value: string | undefined): value is ListingState {
  return STATES.some((entry) => entry.id === value);
}

/** Keeps the query and tab across a page turn, so paging does not
 *  silently reset the filter an operator is working within. */
function href(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/console/listings?${query}` : "/console/listings";
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, state: rawState, before, id } = await searchParams;
  const state: ListingState = isState(rawState) ? rawState : "all";

  const [page, counts] = await Promise.all([
    listSkillListings({
      query: q,
      state,
      cursor: before ? { before, beforeId: id ?? "" } : null,
    }),
    getListingCounts(),
  ]);

  const countFor = (value: ListingState) =>
    value === "all" ? counts.total : counts[value];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Every published Skill card — what a Hustler actually posted, not
          the catalogue they picked the trade from. {counts.total.toLocaleString("en-NG")} in
          total, {PAGE_SIZE} to a page, newest first.
        </p>
      </div>

      {/* A plain GET form: the query lands in the URL, so a search an
          operator wants to hand to somebody else is a link. */}
      <form action="/console/listings" className="flex gap-2">
        <input name="state" type="hidden" value={state} />
        <Input
          defaultValue={q ?? ""}
          name="q"
          placeholder="Search by Skill, business name, owner name, email, or paste an id"
        />
        <button
          className="rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {STATES.map((entry) => (
          <Link
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              state === entry.id
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:bg-white/5"
            }`}
            href={href({ q, state: entry.id })}
            key={entry.id}
          >
            {entry.label}{" "}
            <span className="text-xs text-muted-foreground">
              {countFor(entry.id).toLocaleString("en-NG")}
            </span>
          </Link>
        ))}
      </div>

      {page.rows.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">
          Nothing here. {q ? "Try a different search." : ""}
        </Card>
      ) : (
        <ul className="space-y-3">
          {page.rows.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </ul>
      )}

      {/* Forward only. A keyset cursor knows where the next page starts,
          not where the previous one did — and "Back" in the browser is
          the correct control for going back, because it restores the
          exact page that was rendered rather than re-deriving it. */}
      {page.next ? (
        <Link
          className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          href={href({
            q,
            state,
            before: page.next.before,
            id: page.next.beforeId,
          })}
        >
          Next {PAGE_SIZE} →
        </Link>
      ) : null}

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Suspend asks a question. Take down does not.
        </p>
        <p>
          <strong className="text-foreground">Suspend &amp; ask</strong> hides
          the card and sends the owner the question you type, word for word.
          It lands in <strong className="text-foreground">Needs info</strong>,
          which is the queue to work: when they answer, put it back or take it
          down. Their email is on every row for the follow-up.
        </p>
        <p>
          <strong className="text-foreground">Take it down</strong> is the same
          hiding with a different sentence and no question. Both are reversible
          — neither erases the row. The record is what makes the decision
          reviewable later and what settles the dispute it sometimes causes.
        </p>
        <p>
          Every one of the three notifies the owner as an account action, which
          is the one notification type that cannot be switched off. A listing
          that quietly stops appearing while its owner still sees it in their
          own list is the failure this avoids.
        </p>
      </Card>
    </div>
  );
}
