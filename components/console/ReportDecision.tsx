"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  resolveReport,
  type ReportActionState,
} from "@/lib/console/report-actions";

const INITIAL: ReportActionState = { error: null, done: false };

type Outcome = "actioned" | "reviewed" | "dismissed";

const OUTCOMES: { id: Outcome; label: string; hint: string }[] = [
  {
    id: "actioned",
    label: "Actioned",
    hint: "The report was right and you've done something about it.",
  },
  {
    id: "reviewed",
    label: "Reviewed, no action",
    hint: "You looked. Nothing to do, but it wasn't nonsense either.",
  },
  {
    id: "dismissed",
    label: "Dismissed",
    hint: "Nothing wrong here.",
  },
];

/**
 * Close one report, or reopen a closed one.
 *
 * Deciding is two steps — pick the outcome, then confirm with an
 * optional note — rather than three buttons that fire on first click.
 * Nothing here is irreversible (`resolve_report` moves a row back to
 * pending happily), so the friction isn't guarding against a mistake;
 * it's guarding against the queue being cleared without being read,
 * which is the failure mode a moderation queue actually has.
 */
export function ReportDecision({ id, status }: { id: string; status: string }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (status !== "pending") {
    return <Reopen id={id} />;
  }

  if (outcome === null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {OUTCOMES.map((option) => (
          <Button
            className={
              option.id === "actioned"
                ? "h-8 border-amber-500/40 px-3 text-xs text-amber-400 hover:bg-amber-500/10"
                : "h-8 px-3 text-xs"
            }
            key={option.id}
            onClick={() => setOutcome(option.id)}
            title={option.hint}
            type="button"
            variant="secondary"
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DecisionForm id={id} onCancel={() => setOutcome(null)} outcome={outcome} />
  );
}

function DecisionForm({
  id,
  outcome,
  onCancel,
}: {
  id: string;
  outcome: Outcome;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(resolveReport, INITIAL);
  const chosen = OUTCOMES.find((o) => o.id === outcome)!;

  return (
    <form action={action} className="w-full space-y-2">
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={outcome} />

      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">{chosen.label}</strong> —{" "}
        {chosen.hint}
      </p>

      <textarea
        className="min-h-[3.5rem] w-full rounded-lg border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-accent/50"
        id={`note-${id}`}
        maxLength={1000}
        name="note"
        placeholder="Optional — what you found, for whoever reads this queue next month."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="h-8 px-3 text-xs"
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending ? "Saving…" : `Confirm — ${chosen.label.toLowerCase()}`}
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

/**
 * Put a decided report back in the queue.
 *
 * Exists because the alternative to a reopen button is a manual UPDATE
 * in the SQL editor, and a queue you can only close one way quietly
 * teaches people to leave doubtful rows pending rather than risk
 * closing them wrongly.
 */
function Reopen({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resolveReport, INITIAL);

  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value="pending" />
      <Button
        className="h-8 px-3 text-xs"
        disabled={pending}
        type="submit"
        variant="ghost"
      >
        {pending ? "Reopening…" : "Reopen"}
      </Button>
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
