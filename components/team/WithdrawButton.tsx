"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  withdrawContribution,
  type WithdrawState,
} from "@/lib/team/contribution-actions";

const initial: WithdrawState = { error: null };

/**
 * Taking back an entry that hasn't been looked at yet.
 *
 * Two taps rather than one: this deletes a write-up someone spent time on,
 * and a mis-tap on a phone is easy. Once a reviewer has decided, the button
 * isn't rendered at all — that row is a decision on the record.
 */
export function WithdrawButton({ contributionId }: { contributionId: string }) {
  const [state, action, pending] = useActionState(withdrawContribution, initial);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        onClick={() => setConfirming(true)}
        type="button"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={contributionId} />
      <span className="text-xs text-muted-foreground">Delete this entry?</span>
      <button
        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Removing…" : "Yes, remove"}
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setConfirming(false)}
        type="button"
      >
        Keep it
      </button>
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
