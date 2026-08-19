"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  clearPanicAlert,
  decideHoldAppeal,
  type PanicActionState,
} from "@/lib/console/panic-actions";

const INITIAL: PanicActionState = { error: null, done: false };

/**
 * Stand an alarm down.
 *
 * Two steps on purpose. This unfreezes a booking that both parties are
 * currently locked out of, and it overrides a person's own statement that
 * they were in danger — one click is the wrong price for that. The note box
 * is where the friction sensibly lives, and it doubles as the record.
 */
export function ClearAlertAction({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(clearPanicAlert, INITIAL);

  if (!open) {
    return (
      <Button
        className="h-8 px-3 text-xs"
        onClick={() => setOpen(true)}
        type="button"
        variant="secondary"
      >
        Confirmed safe — close this alert
      </Button>
    );
  }

  return (
    <form action={action} className="w-full space-y-2">
      <input name="id" type="hidden" value={id} />

      <label
        className="block text-xs text-muted-foreground"
        htmlFor={`clear-note-${id}`}
      >
        Who did you speak to, and how do you know they are safe? Name them and
        say how they were identified. This is the whole record of the decision.
      </label>
      <textarea
        className="w-full rounded-lg border border-white/10 bg-transparent p-2 text-sm"
        id={`clear-note-${id}`}
        name="note"
        placeholder="Rang Ifemi (sister, on file) 21:40 — she had spoken to him, he is home and well."
        rows={3}
      />

      {state.error ? (
        <p className="text-xs text-red-400">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          className="h-8 px-3 text-xs"
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending ? "Closing…" : "Close the alert and unfreeze the Hustle"}
        </Button>
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setOpen(false)}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/**
 * Decide an appeal against a hold.
 *
 * Note the wording on the buttons: neither of them ends the freeze. The
 * appellant is told the outcome and the reason; the activator is told
 * nothing, because being appealed at is not something a person in an
 * incident needs to hear about.
 */
export function HoldAppealDecision({ id }: { id: string }) {
  const [status, setStatus] = useState<"upheld" | "rejected" | null>(null);
  const [state, action, pending] = useActionState(decideHoldAppeal, INITIAL);

  if (status === null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setStatus("upheld")}
          type="button"
          variant="secondary"
        >
          Their point stands
        </Button>
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setStatus("rejected")}
          type="button"
          variant="secondary"
        >
          Hold was right
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="w-full space-y-2">
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />

      <label
        className="block text-xs text-muted-foreground"
        htmlFor={`appeal-note-${id}`}
      >
        {status === "upheld"
          ? "Why their point stands. Sent to them. Deciding this does not lift the hold — close the alert for that, and only once you have confirmed it."
          : "Why the hold was right. Sent to them. Say nothing that identifies who raised the alert or when."}
      </label>
      <textarea
        className="w-full rounded-lg border border-white/10 bg-transparent p-2 text-sm"
        id={`appeal-note-${id}`}
        name="note"
        rows={3}
      />

      {state.error ? (
        <p className="text-xs text-red-400">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          className="h-8 px-3 text-xs"
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending ? "Saving…" : "Send the decision"}
        </Button>
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setStatus(null)}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
