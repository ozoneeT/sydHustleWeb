"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";

import {
  reviewContribution,
  type TeamAdminState,
} from "@/lib/console/team-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initial: TeamAdminState = { error: null, done: null };

/**
 * The decision on one claim.
 *
 * Approving prefills the credited hours with what the member said it
 * took, because agreeing is the common case and retyping the same number
 * every time is how a reviewer ends up rubber-stamping without reading.
 * Changing it is one edit; the original claim stays visible above either
 * way, so a disagreement is on the record rather than overwritten.
 *
 * Turning something down requires a note. A rejection with no reason
 * attached is the fastest way to lose someone who is working for nothing.
 */
export function ContributionDecision({
  contributionId,
  claimedHours,
  currentStatus,
  currentNote,
  currentCredited,
}: {
  contributionId: string;
  claimedHours: number | null;
  currentStatus: "pending" | "approved" | "rejected";
  currentNote: string | null;
  currentCredited: number | null;
}) {
  const [state, action, pending] = useActionState(reviewContribution, initial);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    currentStatus === "pending" ? null : currentStatus
  );

  const defaultHours =
    currentCredited ?? claimedHours ?? ("" as number | "");

  return (
    <form action={action} className="space-y-4 border-t border-white/10 pt-4">
      <input name="contributionId" type="hidden" value={contributionId} />
      <input name="decision" type="hidden" value={decision ?? "approved"} />

      <div className="flex flex-wrap gap-2">
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            decision === "approved"
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
          onClick={() => setDecision("approved")}
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
          Counts
        </button>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            decision === "rejected"
              ? "border-red-500/40 bg-red-500/15 text-red-300"
              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
          onClick={() => setDecision("rejected")}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
          Doesn&apos;t count
        </button>
      </div>

      {decision !== null && (
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          {decision === "approved" && (
            <div className="space-y-2">
              <Label htmlFor={`hours-${contributionId}`}>Credit</Label>
              <Input
                defaultValue={defaultHours}
                id={`hours-${contributionId}`}
                inputMode="decimal"
                max={999}
                min={0}
                name="creditedHours"
                placeholder="Hours"
                step="0.25"
                type="number"
              />
            </div>
          )}

          <div className={cn("space-y-2", decision === "rejected" && "sm:col-span-2")}>
            <Label htmlFor={`note-${contributionId}`}>
              {decision === "approved"
                ? "Note (optional — they'll see it)"
                : "Why not? (they'll see this)"}
            </Label>
            <Textarea
              className="min-h-20"
              defaultValue={currentNote ?? ""}
              id={`note-${contributionId}`}
              maxLength={1000}
              name="note"
              required={decision === "rejected"}
            />
          </div>
        </div>
      )}

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.done ? <p className="text-sm text-accent">{state.done}</p> : null}

      {decision !== null && (
        <button
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
            decision === "approved"
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-red-500/20 text-red-200 hover:bg-red-500/30"
          )}
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Recording…"
            : decision === "approved"
              ? currentStatus === "approved"
                ? "Update the credit"
                : "Approve and credit"
              : currentStatus === "rejected"
                ? "Update the reason"
                : "Turn it down"}
        </button>
      )}
    </form>
  );
}
