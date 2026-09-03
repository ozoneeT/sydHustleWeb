"use client";

import { useActionState, useState } from "react";
import { Ban, Check, EyeOff, RotateCcw, ShieldQuestion } from "lucide-react";

import {
  removeListing,
  restoreListing,
  suspendListing,
  type ListingActionState,
} from "@/lib/console/listing-actions";
import type { SkillListing } from "@/lib/console/listings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ListingActionState = { error: null, message: null };

const naira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function Notice({ state }: { state: ListingActionState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-emerald-400">
        <Check className="size-4" aria-hidden /> {state.message}
      </p>
    );
  }
  return null;
}

/**
 * One card, and everything an operator needs before touching it.
 *
 * The owner's name, id and email sit ON the row rather than behind a
 * click: every action here sends that person a notification, and two of
 * them stop them earning. Deciding without knowing who it lands on is
 * the mistake this layout exists to prevent.
 */
export function ListingCard({ listing }: { listing: SkillListing }) {
  const [suspendState, suspendAction, suspending] = useActionState(
    suspendListing,
    initial
  );
  const [removeState, removeAction, removing] = useActionState(
    removeListing,
    initial
  );
  const [restoreState, restoreAction, restoring] = useActionState(
    restoreListing,
    initial
  );
  const [mode, setMode] = useState<"idle" | "suspend" | "remove">("idle");

  const withheld = listing.removed_at !== null;
  const suspended = listing.removal_kind === "suspended";

  return (
    <li className="space-y-3 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{listing.skill_name}</p>
            {listing.certified ? (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
                Certified
              </span>
            ) : null}
            {suspended ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                Needs info
              </span>
            ) : withheld ? (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                Removed
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.display_name}
            {listing.price_amount !== null
              ? ` · ${naira(listing.price_amount)}`
              : ""}
            {listing.rating_count > 0
              ? ` · ${listing.rating_avg.toFixed(1)}★ (${listing.rating_count})`
              : ""}
          </p>
          {listing.bio ? (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-muted-foreground">
              {listing.bio}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-xs">
          {listing.hustler_id ? (
            <>
              <p className="font-medium">
                {listing.owner_name ?? "No name on file"}
              </p>
              {listing.owner_email ? (
                <a
                  className="text-accent hover:underline"
                  href={`mailto:${listing.owner_email}`}
                >
                  {listing.owner_email}
                </a>
              ) : (
                <p className="text-muted-foreground">No email on file</p>
              )}
              <p className="font-mono text-[11px] text-muted-foreground">
                {listing.hustler_id}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Seeded demo listing — no owner
            </p>
          )}
        </div>
      </div>

      {/* What was asked, or why it went. Shown to the operator in the
          same words the owner received, so a follow-up email does not
          contradict the notification. */}
      {listing.info_request ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <span className="font-medium">Asked of the owner:</span>{" "}
          {listing.info_request}
        </p>
      ) : null}
      {listing.removed_reason ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <span className="font-medium">Removed because:</span>{" "}
          {listing.removed_reason}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {withheld ? (
          <form action={restoreAction}>
            <input name="id" type="hidden" value={listing.id} />
            <Button disabled={restoring} size="sm" type="submit" variant="secondary">
              <RotateCcw className="size-3.5" />{" "}
              {restoring ? "Restoring…" : "Put it back"}
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setMode(mode === "suspend" ? "idle" : "suspend")}
            size="sm"
            type="button"
            variant={mode === "suspend" ? "secondary" : "ghost"}
          >
            <ShieldQuestion className="size-3.5" /> Suspend &amp; ask
          </Button>
        )}

        {listing.removal_kind !== "removed" ? (
          <Button
            onClick={() => setMode(mode === "remove" ? "idle" : "remove")}
            size="sm"
            type="button"
            variant={mode === "remove" ? "secondary" : "ghost"}
          >
            <Ban className="size-3.5" /> Take it down
          </Button>
        ) : null}
      </div>

      {mode === "suspend" && !withheld ? (
        <form action={suspendAction} className="space-y-2">
          <input name="id" type="hidden" value={listing.id} />
          <Textarea
            name="question"
            placeholder="What do you need from them? e.g. “Send a photo of your workspace and the certificate you mention in your bio.” They read this exactly as written."
            rows={3}
          />
          <Notice state={suspendState} />
          <Button disabled={suspending} size="sm" type="submit">
            <EyeOff className="size-3.5" />{" "}
            {suspending ? "Hiding…" : "Hide it and ask"}
          </Button>
        </form>
      ) : null}

      {mode === "remove" ? (
        <form action={removeAction} className="space-y-2">
          <input name="id" type="hidden" value={listing.id} />
          <Textarea
            name="reason"
            placeholder="Why is this coming down? The owner is told, and so is whoever reviews the decision later."
            rows={3}
          />
          <Notice state={removeState} />
          <Button disabled={removing} size="sm" type="submit">
            <Ban className="size-3.5" /> {removing ? "Removing…" : "Take it down"}
          </Button>
        </form>
      ) : null}

      <Notice state={restoreState} />
    </li>
  );
}
