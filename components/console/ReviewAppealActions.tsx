"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  rejectReviewAppeal,
  upholdReviewAppeal,
  type ReviewAppealActionState,
} from "@/lib/console/review-appeal-actions";

const INITIAL: ReviewAppealActionState = { error: null, done: false };

type Decision = "uphold" | "reject";

/**
 * Decide one appeal.
 *
 * Both outcomes go through the same two-step: pick, write the reason,
 * confirm. Removing a review is irreversible — the reviewer can never
 * write another for that job, because the unique constraint still holds
 * — so it should cost more than one click, and the reason box is where
 * that friction sensibly lives.
 */
export function ReviewAppealDecision({ id }: { id: string }) {
  const [decision, setDecision] = useState<Decision | null>(null);

  if (decision === null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
          onClick={() => setDecision("uphold")}
          type="button"
          variant="secondary"
        >
          Remove the review
        </Button>
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setDecision("reject")}
          type="button"
          variant="secondary"
        >
          Keep it up
        </Button>
      </div>
    );
  }

  return (
    <DecisionForm decision={decision} id={id} onCancel={() => setDecision(null)} />
  );
}

function DecisionForm({
  id,
  decision,
  onCancel,
}: {
  id: string;
  decision: Decision;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(
    decision === "uphold" ? upholdReviewAppeal : rejectReviewAppeal,
    INITIAL
  );

  const upholding = decision === "uphold";

  return (
    <form action={action} className="w-full space-y-2">
      <input name="id" type="hidden" value={id} />

      <label className="block text-xs text-muted-foreground" htmlFor={`note-${id}`}>
        {upholding
          ? "Why it's coming down. Sent to the person who wrote the review."
          : "Why it stays up. Sent to the person who appealed."}
      </label>
      <textarea
        className="min-h-[4.5rem] w-full rounded-lg border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-accent/50"
        id={`note-${id}`}
        maxLength={500}
        minLength={10}
        name="note"
        placeholder={
          upholding
            ? "e.g. The comment named the Hustler's home address, which breaks our review rules."
            : "e.g. We checked the chat and found no refund request before this review, so it doesn't meet the retaliation bar."
        }
        required
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className={
            upholding
              ? "h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
              : "h-8 px-3 text-xs"
          }
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending
            ? "Saving…"
            : upholding
              ? "Confirm removal"
              : "Confirm — review stays"}
        </Button>
        <Button
          className="h-8 px-2 text-xs"
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        {state.error ? (
          <span className="text-xs text-red-400">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
