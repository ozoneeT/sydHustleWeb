"use client";

import { useActionState, useState } from "react";

import {
  waiveVerificationAttempts,
  type WaiveState,
} from "@/lib/console/identity-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: WaiveState = { error: null, done: null };

/**
 * Handing someone their verification attempts back.
 *
 * Offered on accounts that are merely counting as well as on ones
 * already refused, because support hears from people at two of three as
 * often as at three of three — and waiting for them to be fully locked
 * out before helping is a rule with nothing behind it.
 *
 * The reason box is required and is written onto the attempt for good.
 * Nothing is deleted: an override with no trail is the hole this was
 * meant to close.
 */
export function WaiveAttempts({
  blocked,
  kind,
  profileId,
}: {
  blocked: boolean;
  kind: "nin" | "bvn";
  profileId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, waive, pending] = useActionState(
    waiveVerificationAttempts,
    initialState
  );

  if (state.done) {
    return <span className="text-xs text-emerald-400">{state.done}</span>;
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant={blocked ? "default" : "secondary"}
      >
        {blocked ? "Let them try again" : "Hand attempts back"}
      </Button>
    );
  }

  return (
    <form action={waive} className="w-full max-w-md space-y-2">
      <input name="profileId" type="hidden" value={profileId} />
      <input name="kind" type="hidden" value={kind} />
      <Textarea
        name="reason"
        placeholder="Why this is not fraud — e.g. “NIMC record carries no state of origin”. Kept on the attempt permanently."
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Handing back…" : "Hand them back"}
        </Button>
        <Button
          onClick={() => setOpen(false)}
          size="sm"
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
