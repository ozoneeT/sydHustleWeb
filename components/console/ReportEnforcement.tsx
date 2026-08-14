"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  enforceReport,
  refundHeldEscrow,
  type EnforcementState,
} from "@/lib/console/enforcement";
import type { InFlight } from "@/lib/console/reports";

const INITIAL: EnforcementState = { error: null, done: false };

type Action = "warn" | "remove" | "suspend" | "terminate" | "reinstate";

const REMOVE_LABELS: Record<string, string> = {
  skill: "Remove Skill",
  hustle: "Remove Hustle",
  message: "Remove message",
  review: "Remove review",
};

/**
 * What can be done about one report.
 *
 * Every action sends the person an in-app notification AND an email
 * carrying the reason verbatim, which is why the reason box is required
 * rather than optional. Somebody who is suspended without being told why
 * files a support ticket, an app-store complaint, or both.
 *
 * Suspension and termination are offered on every report, not just
 * profile ones: the thing reported is a piece of content, but the
 * decision is usually about the account behind it.
 */
export function ReportEnforcement({
  reportId,
  targetType,
  ownerName,
  suspendedUntil,
  terminatedAt,
  removable,
  inFlight,
}: {
  reportId: string;
  targetType: string;
  ownerName: string | null;
  suspendedUntil: string | null;
  terminatedAt: string | null;
  removable: boolean;
  inFlight: InFlight | null;
}) {
  const [action, setAction] = useState<Action | null>(null);

  const sanctioned = Boolean(terminatedAt || suspendedUntil);

  if (action) {
    return (
      <EnforceForm
        action={action}
        onCancel={() => setAction(null)}
        ownerName={ownerName}
        reportId={reportId}
        targetType={targetType}
      />
    );
  }

  return (
    <div className="space-y-2">
      {sanctioned ? (
        <p className="text-xs text-amber-400">
          {terminatedAt
            ? `${ownerName ?? "This account"} is already terminated.`
            : `${ownerName ?? "This account"} is suspended until ${new Date(
                suspendedUntil!
              ).toLocaleDateString("en-NG")}.`}
        </p>
      ) : null}

      {inFlight ? <InFlightNotice inFlight={inFlight} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setAction("warn")}
          type="button"
          variant="secondary"
        >
          Warn
        </Button>

        {removable ? (
          <Button
            className="h-8 border-amber-500/40 px-3 text-xs text-amber-400 hover:bg-amber-500/10"
            onClick={() => setAction("remove")}
            type="button"
            variant="secondary"
          >
            {REMOVE_LABELS[targetType] ?? "Remove content"}
          </Button>
        ) : null}

        <Button
          className="h-8 border-orange-500/40 px-3 text-xs text-orange-400 hover:bg-orange-500/10"
          onClick={() => setAction("suspend")}
          type="button"
          variant="secondary"
        >
          Suspend account
        </Button>

        <Button
          className="h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
          onClick={() => setAction("terminate")}
          type="button"
          variant="secondary"
        >
          Terminate account
        </Button>

        {sanctioned ? (
          <Button
            className="h-8 border-emerald-500/40 px-3 text-xs text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => setAction("reinstate")}
            type="button"
            variant="secondary"
          >
            Reinstate
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const PROMPTS: Record<Action, { verb: string; hint: string; example: string }> = {
  warn: {
    verb: "Warn",
    hint: "They keep everything. They're told what the problem was.",
    example:
      "Your Hustle description asked people to pay you outside sydHustle, which our rules don't allow. Please don't do it again.",
  },
  remove: {
    verb: "Remove",
    hint: "The content stops being visible. The account is untouched.",
    example:
      "The cover photo on this Skill breaks our rules on explicit content, so the listing has been taken down.",
  },
  suspend: {
    verb: "Suspend",
    hint:
      "They cannot sign in until it expires. Their listings hide and come back on their own; unfunded commitments are closed. Held escrow is not moved.",
    example:
      "You sent threatening messages to a Hustler on 14 August. Your account is suspended while we review it.",
  },
  terminate: {
    verb: "Terminate",
    hint:
      "Permanent. They cannot sign in again, their listings stay hidden, and unfunded commitments are closed. Held escrow is not moved.",
    example:
      "Your account has been closed for repeatedly attempting to take payments off the platform after previous warnings.",
  },
  reinstate: {
    verb: "Reinstate",
    hint: "Lifts the suspension or termination immediately.",
    example:
      "We've re-checked the reports against your account and lifted the suspension. Sorry for the disruption.",
  },
};

function EnforceForm({
  reportId,
  action,
  targetType,
  ownerName,
  onCancel,
}: {
  reportId: string;
  action: Action;
  targetType: string;
  ownerName: string | null;
  onCancel: () => void;
}) {
  const [state, submit, pending] = useActionState(enforceReport, INITIAL);
  const prompt = PROMPTS[action];

  return (
    <form action={submit} className="w-full space-y-2">
      <input name="reportId" type="hidden" value={reportId} />
      <input name="action" type="hidden" value={action} />

      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">
          {prompt.verb}
          {action === "remove"
            ? ` this ${targetType}`
            : ownerName
              ? ` ${ownerName}`
              : ""}
        </strong>{" "}
        — {prompt.hint}
      </p>

      {action === "suspend" ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          For
          <select
            className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-accent/50"
            defaultValue="7"
            name="days"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </label>
      ) : null}

      <label
        className="block text-xs text-muted-foreground"
        htmlFor={`reason-${reportId}`}
      >
        Why. Sent to them word for word, by push and by email.
      </label>
      <textarea
        className="min-h-[4.5rem] w-full rounded-lg border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-accent/50"
        id={`reason-${reportId}`}
        maxLength={1000}
        minLength={10}
        name="reason"
        placeholder={prompt.example}
        required
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className={
            action === "terminate"
              ? "h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
              : "h-8 px-3 text-xs"
          }
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending ? "Working…" : `Confirm — ${prompt.verb.toLowerCase()}`}
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
        {/* The action succeeded but something downstream didn't. Said
            out loud rather than swallowed — a suspension whose email
            bounced is worse to hide than to report. */}
        {state.note ? (
          <span className="text-xs text-amber-400">Done, but: {state.note}</span>
        ) : null}
      </div>
    </form>
  );
}

const naira = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/**
 * What a suspension is about to interrupt.
 *
 * Shown before the buttons, not after the decision. Suspending somebody
 * holding ₦120,000 of another person's money is a different call from
 * suspending somebody holding none, and without this the two looked
 * identical on screen.
 *
 * Held escrow gets its own block with a refund button per engagement,
 * because that is the one part suspension deliberately does NOT resolve
 * on its own — the right answer depends on whether the work was done,
 * which no moderation decision contains.
 */
function InFlightNotice({ inFlight }: { inFlight: InFlight }) {
  const bits: string[] = [];
  if (inFlight.open_hustles)
    bits.push(`${inFlight.open_hustles} open ${inFlight.open_hustles === 1 ? "Hustle" : "Hustles"}`);
  if (inFlight.skills)
    bits.push(`${inFlight.skills} ${inFlight.skills === 1 ? "Skill" : "Skills"}`);
  if (inFlight.unfunded)
    bits.push(`${inFlight.unfunded} unfunded ${inFlight.unfunded === 1 ? "commitment" : "commitments"}`);
  if (inFlight.wallet_balance > 0)
    bits.push(`${naira(inFlight.wallet_balance)} in their wallet`);
  if (inFlight.pending_withdrawals)
    bits.push(`${inFlight.pending_withdrawals} withdrawal in flight`);

  if (bits.length === 0 && inFlight.funded.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      {bits.length ? (
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Suspending interrupts:</strong>{" "}
          {bits.join(", ")}. Listings hide while they&rsquo;re suspended and come
          back on their own; unfunded commitments are closed and the other side
          told.
        </p>
      ) : null}

      {inFlight.funded.length ? (
        <div className="space-y-2">
          <p className="text-xs text-amber-400">
            <strong>{naira(inFlight.funded_total)} is held in escrow</strong>{" "}
            across {inFlight.funded.length}{" "}
            {inFlight.funded.length === 1 ? "job" : "jobs"}. Suspending does not
            move it — both sides are told the work is on hold, and someone has to
            decide.
          </p>
          {inFlight.funded.map((job) => (
            <RefundRow job={job} key={`${job.kind}:${job.source_id}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RefundRow({ job }: { job: InFlight["funded"][number] }) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(refundHeldEscrow, INITIAL);

  return (
    <div className="rounded border border-white/10 p-2">
      <p className="text-xs">
        <strong>{naira(job.amount)}</strong> — {job.title ?? job.kind} ·{" "}
        {job.role === "paying" ? "they paid" : "they were to be paid"}
        {job.counterparty ? ` · with ${job.counterparty}` : ""}
      </p>

      {open ? (
        <form action={submit} className="mt-2 space-y-2">
          <input name="kind" type="hidden" value={job.kind} />
          <input name="sourceId" type="hidden" value={job.source_id} />
          <textarea
            className="w-full rounded border border-white/10 bg-transparent p-2 text-xs outline-none focus:border-accent/50"
            maxLength={500}
            minLength={10}
            name="note"
            placeholder="Why the money is going back — kept on the ledger entry."
            required
          />
          <div className="flex items-center gap-2">
            <Button className="h-7 px-2 text-xs" disabled={pending} type="submit" variant="secondary">
              {pending ? "Refunding…" : "Confirm refund (no fee)"}
            </Button>
            <Button className="h-7 px-2 text-xs" onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            {state.error ? <span className="text-xs text-red-400">{state.error}</span> : null}
          </div>
        </form>
      ) : (
        <Button
          className="mt-1 h-7 px-2 text-xs"
          onClick={() => setOpen(true)}
          type="button"
          variant="ghost"
        >
          Refund the payer
        </Button>
      )}
    </div>
  );
}
