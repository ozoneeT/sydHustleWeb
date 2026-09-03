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
  const [awardedTo, setAwardedTo] = useState<
    "provider" | "hustler" | "split" | null
  >(null);
  /**
   * The Hustler's share on a split, as a string so the field can be
   * empty rather than defaulting to a number nobody chose. 1-99: 0 and
   * 100 are the outright awards above, and offering them here would give
   * the same decision two spellings with different records.
   */
  const [percent, setPercent] = useState("");
  const percentValue = Number(percent);
  const percentValid =
    percent.trim() !== "" &&
    Number.isInteger(percentValue) &&
    percentValue >= 1 &&
    percentValue <= 99;

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
      <input
        name="hustlerPercent"
        type="hidden"
        value={awardedTo === "split" ? percent : ""}
      />

      <div>
        <h2 className="text-sm font-semibold">Award {amountLabel}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This cannot be undone.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["hustler", hustlerName, "Work was done — release the payment"],
            ["provider", providerName, "Work wasn't done — refund the payer"],
            [
              "split",
              "Split it",
              "Partly done, or fault on both sides — divide the money",
            ],
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

      {/* Only once a split is chosen. A percentage field standing open
          beside two outright buttons invites somebody to fill it in and
          then award outright, which records a decision nobody made. */}
      {awardedTo === "split" ? (
        <div className="rounded-xl border border-white/10 p-3">
          <label className="block text-sm font-semibold" htmlFor="split-share">
            {hustlerName}&apos;s share
          </label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              className="max-w-24"
              id="split-share"
              inputMode="numeric"
              max={99}
              min={1}
              onChange={(event) => setPercent(event.target.value)}
              placeholder="50"
              type="number"
              value={percent}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {percentValid
              ? `${percentValue}% to ${hustlerName}, the remaining ${100 - percentValue}% back to ${providerName}. Each side is charged on their own share — ${hustlerName} the platform fee at this Hustle's rate, ${providerName} the escrow cut — so neither pays a whole-job fee on a part-job outcome.`
              : "Between 1 and 99. For all or nothing, use the buttons above."}
          </p>
        </div>
      ) : null}

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
          disabled={
            pending || !awardedTo || (awardedTo === "split" && !percentValid)
          }
          type="submit"
        >
          {pending
            ? "Awarding…"
            : awardedTo === "split" && percentValid
              ? `Split ${percentValue}/${100 - percentValue}`
              : "Award the money"}
        </Button>
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
