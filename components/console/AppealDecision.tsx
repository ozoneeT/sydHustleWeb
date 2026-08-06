"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  resolveAppeal,
  type ResolveAppealState,
} from "@/lib/console/appeal-actions";

type AppealDecisionProps = {
  kind: "hustle" | "booking";
  sourceId: string;
  providerName: string;
  hustlerName: string;
  amountLabel: string;
};

const INITIAL: ResolveAppealState = { error: null, resolved: false };

/**
 * The decision, and the only thing on this screen that moves money.
 *
 * Awarding the Hustler releases the escrow to them minus the platform
 * fee, exactly as a normal completion would. Awarding the Provider
 * refunds it. There is no undo — hence picking a side, typing AWARD, and
 * a note that becomes the audit trail.
 */
export function AppealDecision({
  kind,
  sourceId,
  providerName,
  hustlerName,
  amountLabel,
}: AppealDecisionProps) {
  const [state, formAction, pending] = useActionState(resolveAppeal, INITIAL);
  const [awardedTo, setAwardedTo] = useState<"provider" | "hustler" | null>(null);

  if (state.resolved) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <p className="font-semibold text-emerald-400">Decision recorded</p>
        <p className="mt-1 text-muted-foreground">
          The money has moved and the appeal is closed.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-white/10 p-4">
      <input name="kind" type="hidden" value={kind} />
      <input name="sourceId" type="hidden" value={sourceId} />
      <input name="awardedTo" type="hidden" value={awardedTo ?? ""} />

      <div>
        <h2 className="text-sm font-semibold">Award {amountLabel} to</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This cannot be undone.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["hustler", hustlerName, "Work was done — release the payment"],
            ["provider", providerName, "Work wasn't done — refund the payer"],
          ] as const
        ).map(([role, name, why]) => (
          <button
            className={`rounded-xl border p-3 text-left transition-colors ${
              awardedTo === role
                ? "border-accent bg-accent/10"
                : "border-white/10 hover:bg-white/5"
            }`}
            key={role}
            onClick={() => setAwardedTo(role)}
            type="button"
          >
            <span className="block text-sm font-semibold">{name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {why}
            </span>
          </button>
        ))}
      </div>

      <Textarea
        name="note"
        placeholder="Why (kept as the record of this decision)"
        rows={2}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-40"
          name="confirm"
          placeholder="Type AWARD"
          required
        />
        {/* Red rather than the accent: this is the one control here that
            moves money, and it should not look like the Send button. */}
        <Button
          className="bg-red-500 text-white shadow-red-500/25 hover:bg-red-500/90"
          disabled={pending || !awardedTo}
          type="submit"
        >
          {pending ? "Awarding…" : "Award the money"}
        </Button>
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
