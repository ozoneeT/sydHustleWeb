"use client";

import { useActionState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Search,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { naira, settlementId, shortDate } from "@/lib/console/format";
import {
  checkReceiptStamp,
  type CheckState,
  type LinkedEntry,
  type ReceiptCheck,
} from "@/lib/console/receipt-actions";
import { cn } from "@/lib/utils";

/**
 * The stamp check, and the payment behind it.
 *
 * Ask the person for the two things printed on their receipt: the
 * transaction ID and the authenticity stamp. A matching code proves the
 * figures they are quoting are the ones we issued, and then everything
 * attached to that payment opens below: both parties, every ledger entry
 * that shares the same source, each wallet before and after, the hold and
 * the withdrawal.
 *
 * The balances are the reason this page exists. "They say they were never
 * credited" is answered by one row: the worker's credit, the balance it
 * landed on, and the balance it landed from.
 */

const INITIAL: CheckState = {
  error: null,
  result: null,
  reference: "",
  code: "",
};

const REASON_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  withdrawal_reversal: "Withdrawal returned",
  escrow_hold: "Escrow lock",
  escrow_release: "Escrow release",
  escrow_refund: "Escrow refund",
  fee: "Service fee",
  adjustment: "Adjustment",
};

const FAILURES: Record<string, { title: string; detail: string }> = {
  bad_signature: {
    title: "That code does not match this transaction",
    detail:
      "The stamp was not issued for this transaction ID. Check for a mistyped character first, then treat the receipt as edited: an altered amount or name produces exactly this. Ask them to send the receipt again straight from the app.",
  },
  not_found: {
    title: "No receipt has been issued for that transaction ID",
    detail:
      "Either the ID is wrong, or nobody has ever opened the receipt for it in the app. A stamp is minted the first time a receipt is viewed, so an unviewed transaction has no code to quote.",
  },
  unavailable: {
    title: "The verifier is not answering",
    detail: "The signing key may not be installed on this database yet.",
  },
};

export function ReceiptStampCheck() {
  const [state, formAction, pending] = useActionState(
    checkReceiptStamp,
    INITIAL,
  );

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reference">Transaction ID</Label>
            <Input
              autoComplete="off"
              defaultValue={state.reference}
              id="reference"
              name="reference"
              placeholder="SYD-0A1B2C3D4E"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Authenticity stamp</Label>
            <Input
              autoComplete="off"
              defaultValue={state.code}
              id="code"
              name="code"
              placeholder="9F3A 7C21 B0D4 8E56"
              spellCheck={false}
            />
          </div>
          <Button disabled={pending} type="submit">
            <Search className="size-4" />
            {pending ? "Checking..." : "Open payment"}
          </Button>
        </div>

        {state.error ? (
          <p className="mt-3 text-sm text-amber-400">{state.error}</p>
        ) : null}
      </form>

      {state.result ? <ReceiptCheckOutcome result={state.result} /> : null}
    </div>
  );
}

/**
 * The findings, split out from the form that fetches them.
 *
 * Exported because it is a pure rendering of one check result and nothing
 * else: no state, no action, no session. That makes it the piece worth
 * rendering on its own when checking the layout against sample data,
 * rather than signing into the console to look at a table.
 */
export function ReceiptCheckOutcome({ result }: { result: ReceiptCheck }) {
  if (result.verdict !== "valid") {
    const copy = FAILURES[result.verdict] ?? FAILURES.unavailable;
    const serious = result.verdict === "bad_signature";
    return (
      <div
        className={cn(
          "flex gap-4 rounded-xl border p-5",
          serious ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5",
        )}
      >
        {serious ? (
          <ShieldAlert className="size-6 shrink-0 text-red-400" />
        ) : (
          <ShieldQuestion className="size-6 shrink-0 text-muted-foreground" />
        )}
        <div>
          <p className="font-semibold">{copy.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {copy.detail}
          </p>
        </div>
      </div>
    );
  }

  const { signed, entry, entries, parties, escrow, work, withdrawal } = result;

  /**
   * Whether the paper still agrees with the ledger.
   *
   * The signed payload is what the receipt said when it was issued; the
   * entry is what the ledger says now. They should be identical, and when
   * they are not that is the finding, not a footnote.
   */
  const drifted =
    signed && entry
      ? signed.direction !== entry.direction ||
        Number(signed.amount) !== Number(entry.amount) ||
        signed.reason !== entry.reason
      : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-5 py-4">
        <BadgeCheck className="size-6 shrink-0 text-accent" />
        <div>
          <p className="font-semibold">Stamp matches this transaction</p>
          <p className="text-sm text-muted-foreground">
            We issued this receipt, with these figures, on{" "}
            {signed ? shortDate(signed.issuedAt) : "an unknown date"}.
          </p>
        </div>
      </div>

      {drifted && signed && entry ? (
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-amber-300">
              The receipt and the ledger disagree
            </p>
            <p className="mt-1 text-muted-foreground">
              The receipt was issued as {signed.direction} {naira(signed.amount)}{" "}
              ({REASON_LABELS[signed.reason] ?? signed.reason}). The ledger row
              now reads {entry.direction} {naira(entry.amount)} (
              {REASON_LABELS[entry.reason] ?? entry.reason}). The ledger is
              append-only, so this needs escalating rather than resolving.
            </p>
          </div>
        </div>
      ) : null}

      {/* Deposits get their settlement ID here; payouts get theirs inside
          the Withdrawal section, which reads better beside the bank
          details it belongs to. Rendered high on the page either way,
          because on a "money never arrived" call it is the first thing
          the operator needs to read out and the last thing that should
          be buried under four sections of escrow history. */}
      {entry?.settlementId && !withdrawal ? (
        <Section title="Settlement ID">
          <p className="select-all font-mono text-lg tracking-wide">
            {settlementId(entry.settlementId)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The NIP session ID for this transfer. This is the number the
            user&apos;s bank can trace — the SYD reference above means
            nothing to them.
          </p>
        </Section>
      ) : null}

      {parties && parties.length > 0 ? (
        <Section title="Parties">
          <div className="grid gap-3 sm:grid-cols-2">
            {parties.map((party) => (
              <div
                className="rounded-lg border border-white/10 bg-white/5 p-4"
                key={`${party.role}-${party.profileId}`}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {party.role === "payer"
                    ? "Payer"
                    : party.role === "worker"
                      ? "Hustler"
                      : "Account holder"}
                </p>
                <p className="mt-1 font-semibold">{party.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Wallet now:{" "}
                  <span className="font-mono text-foreground">
                    {party.walletBalance === null
                      ? "no wallet"
                      : naira(party.walletBalance)}
                  </span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {party.profileId}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {escrow ? (
        <Section title="Escrow hold">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Row label="Status" value={escrow.status} strong />
            <Row label="Held" value={shortDate(escrow.heldAt)} />
            <Row label="Amount held" value={naira(escrow.amount)} />
            <Row
              label="Platform fee"
              value={escrow.fee ? naira(escrow.fee) : "none"}
            />
            <Row
              label="Status last changed"
              value={shortDate(escrow.statusChangedAt)}
            />
            <Row label="Work" value={work?.title ?? "—"} />
            <Row
              label={escrow.kind === "hustle" ? "Application" : "Booking"}
              value={work?.status ?? "—"}
            />
            {work?.hustleStatus ? (
              <Row label="Hustle" value={work.hustleStatus} />
            ) : null}
            {work?.appealCause ? (
              <Row label="Appealed" value={work.appealNote ?? "yes"} />
            ) : null}
          </dl>
        </Section>
      ) : null}

      {withdrawal ? (
        <Section title="Withdrawal">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Row label="Status" value={withdrawal.status} strong />
            <Row label="Requested" value={shortDate(withdrawal.requestedAt)} />
            <Row label="Amount" value={naira(withdrawal.amount)} />
            <Row label="Fee" value={naira(withdrawal.fee)} />
            <Row label="Sent to bank" value={naira(withdrawal.net)} strong />
            <Row
              label="Status last changed"
              value={shortDate(withdrawal.statusChangedAt)}
            />
            <Row
              label="Bank"
              value={`${withdrawal.bankName ?? "unknown"} · ${
                withdrawal.accountNumber ?? "?"
              }`}
            />
            <Row label="Account name" value={withdrawal.accountName ?? "—"} />
            <Row
              label="Provider"
              value={`${withdrawal.provider ?? "none"}${
                withdrawal.providerReference
                  ? ` · ${withdrawal.providerReference}`
                  : ""
              }`}
            />
            {/* Directly under the provider handle, because the pair is
                the whole point: the line above is what Paystack or
                Payvessel can look up, this one is what the user's own
                bank can. An operator chasing a payout needs to know which
                is which before they pick up the phone. */}
            <Row
              label="Settlement ID"
              value={
                withdrawal.sessionId
                  ? settlementId(withdrawal.sessionId)
                  : withdrawal.status === "pending" ||
                      withdrawal.status === "processing"
                    ? "awaiting the rail"
                    : "—"
              }
              strong={Boolean(withdrawal.sessionId)}
            />
            <Row
              label="Triggered by"
              value={withdrawal.automatic ? "standing instruction" : "the user"}
            />
            {withdrawal.failureReason ? (
              <Row label="Failure" value={withdrawal.failureReason} />
            ) : null}
          </dl>
        </Section>
      ) : null}

      {entries && entries.length > 0 ? (
        <Section
          title="Every entry on this payment"
          note="Balance before is derived from the entry's own direction, so it is exact. The highlighted row is the one the receipt was issued for."
        >
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Before</th>
                  <th className="px-3 py-2 text-right">After</th>
                  <th className="px-3 py-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <EntryRow key={row.reference} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function EntryRow({ row }: { row: LinkedEntry }) {
  const credit = row.direction === "credit";
  return (
    <tr
      className={cn(
        "border-b border-white/5",
        row.is_subject && "bg-accent/5",
      )}
    >
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {shortDate(row.created_at)}
      </td>
      <td className="px-3 py-2 font-medium">{row.profile_name}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {REASON_LABELS[row.reason] ?? row.reason}
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-3 py-2 text-right font-mono",
          credit ? "text-emerald-400" : "text-red-400",
        )}
      >
        {credit ? "+" : "−"}
        {naira(row.amount)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-muted-foreground">
        {naira(row.balance_before)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
        {naira(row.balance_after)}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
        {row.reference}
      </td>
    </tr>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {note ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-white/5 pb-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm",
          strong ? "font-semibold text-foreground" : "text-foreground/90",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
