"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Loader2,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { naira, shortDate } from "@/lib/console/format";
import { cn } from "@/lib/utils";

/**
 * The stamp checker.
 *
 * Two ways in, because a receipt offers two. Scanning the QR lands here
 * with the whole signed token in the URL fragment, which is checked on
 * arrival with nothing to fill in. Reading the printed code needs the
 * transaction ID beside it, because a code on its own is a signature with
 * nothing to be a signature OF.
 *
 * The token is read from `location.hash` rather than from a search param
 * or a route segment, and that is a privacy decision, not a style one. A
 * fragment is never sent to a server, so the signed payload (a person's
 * name, a Hustle title) stays out of access logs and Referer headers. It
 * also means this component has to be a client one: the server never sees
 * the token at all.
 */

type Receipt = {
  reference: string;
  direction: "credit" | "debit";
  amount: number;
  reason: string;
  issuedAt: string;
  counterparty: string;
  workTitle: string;
};

type Result = {
  verdict:
    | "valid"
    | "bad_signature"
    | "malformed"
    | "unsupported_version"
    | "not_found"
    | "rate_limited"
    | "unavailable";
  receipt?: Receipt;
  ledger?: "match" | "mismatch" | "not_found";
  currentState?: string | null;
};

/** How each ledger reason reads to someone who does not work here. */
const REASON_LABELS: Record<string, string> = {
  deposit: "Wallet top-up",
  withdrawal: "Withdrawal",
  withdrawal_reversal: "Withdrawal returned",
  escrow_hold: "Payment held in escrow",
  escrow_release: "Payment released",
  escrow_refund: "Payment refunded",
  fee: "Service fee",
  adjustment: "Adjustment",
};

/**
 * What a failed check means in plain words.
 *
 * None of these say "fake". A stamp that does not recompute is most often
 * a mistyped code or a QR that half-scanned, and telling someone their
 * neighbour forged a receipt on that evidence would be worse than saying
 * nothing.
 */
const FAILURES: Record<
  Exclude<Result["verdict"], "valid">,
  { title: string; detail: string }
> = {
  bad_signature: {
    title: "This stamp does not match",
    detail:
      "The code and the receipt it came from do not agree. That usually means a character was mistyped, or the image was edited after we issued it. Check the code again, and if it still fails, ask the sender for the receipt straight from their sydHustle app.",
  },
  not_found: {
    title: "We have no receipt with that ID",
    detail:
      "Transaction IDs look like SYD-0A1B2C3D4E. Check for a missing character, and make sure you are reading the Transaction ID rather than the stamp code.",
  },
  malformed: {
    title: "That code could not be read",
    detail:
      "The scan came through incomplete. Try scanning again, holding the phone steady and filling the frame with the code, or type the printed code in below instead.",
  },
  unsupported_version: {
    title: "This stamp is a newer format",
    detail:
      "Our verifier does not recognise it yet. Please contact support@sydhustle.com with the transaction ID.",
  },
  rate_limited: {
    title: "Too many checks",
    detail:
      "We limit how often a single visitor can check stamps. Wait a minute and try again.",
  },
  unavailable: {
    title: "We could not check it just now",
    detail:
      "Something on our side is not answering. Please try again shortly, or contact support@sydhustle.com.",
  },
};

export function VerifyReceipt() {
  /**
   * A transition rather than a `checking` flag of our own.
   *
   * `isPending` covers the whole async action, which keeps the spinner
   * honest without this component setting state synchronously from the
   * effect below. That is not a style preference: setting state directly in
   * an effect body triggers a cascading render, and the compiler's lint
   * rules reject it.
   *
   * Nothing clears the previous result at the start of a check either. The
   * pending branch renders ahead of any result, so a stale verdict is
   * already hidden while a new one is in flight.
   */
  const [checking, startCheck] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [reference, setReference] = useState("");
  const [code, setCode] = useState("");

  const check = useCallback((body: object) => {
    startCheck(async () => {
      try {
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setResult((await response.json()) as Result);
      } catch {
        // A dropped connection is not a failed stamp, and must not be
        // reported as one.
        setResult({ verdict: "unavailable" });
      }
    });
  }, []);

  // A scan arrives with the token already in hand, so it checks itself.
  // Making someone press a button to confirm what they just scanned is a
  // step that exists only because the page was easier to write that way.
  useEffect(() => {
    const token = window.location.hash.replace(/^#/, "").trim();
    if (token) check({ token });
  }, [check]);

  // A "valid" verdict with no payload attached is a broken response rather
  // than a pass, so it is reported as one instead of rendering an empty
  // receipt under a tick.
  const passed = result?.verdict === "valid" ? result.receipt : undefined;
  const failure: Exclude<Result["verdict"], "valid"> | null = !result
    ? null
    : result.verdict === "valid"
      ? passed
        ? null
        : "unavailable"
      : result.verdict;

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {checking ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="checking"
          >
            <Loader2 className="size-5 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">
              Checking this stamp against our records.
            </p>
          </motion.div>
        ) : passed ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key="valid"
          >
            <ValidResult
              ledger={result?.ledger ?? "not_found"}
              receipt={passed}
              state={result?.currentState ?? null}
            />
          </motion.div>
        ) : failure ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key={failure}
          >
            <FailedResult verdict={failure} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form
        className="rounded-2xl border border-white/10 bg-white/5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!checking) check({ reference, code });
        }}
      >
        <h2 className="text-lg font-bold tracking-tight">
          Check a printed code
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Both of these are on the receipt: the Transaction ID near the
          bottom, and the stamp code beneath it.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reference">Transaction ID</Label>
            <Input
              autoCapitalize="characters"
              id="reference"
              name="reference"
              onChange={(event) => setReference(event.target.value)}
              placeholder="SYD-0A1B2C3D4E"
              spellCheck={false}
              value={reference}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Stamp code</Label>
            <Input
              autoCapitalize="characters"
              id="code"
              name="code"
              onChange={(event) => setCode(event.target.value)}
              placeholder="9F3A 7C21 B0D4 8E56"
              spellCheck={false}
              value={code}
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={checking || reference.trim() === "" || code.trim() === ""}
          type="submit"
        >
          {checking ? "Checking..." : "Check this receipt"}
        </Button>
      </form>
    </div>
  );
}

function ValidResult({
  receipt,
  ledger,
  state,
}: {
  receipt: Receipt;
  ledger: "match" | "mismatch" | "not_found";
  state: string | null;
}) {
  /**
   * Two separate questions, and the page answers both.
   *
   * The stamp proves WE ISSUED this receipt and that its figures are the
   * ones we signed. Whether the money stayed where the receipt implies is
   * a different question, answered from the live ledger, and a genuine
   * receipt for a payment that was later returned is exactly the case
   * worth catching. Reporting only the first would make this page a
   * rubber stamp for a stale document.
   */
  const returned = state === "refunded" || state === "reversed";
  const held = state === "held";

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-accent/5">
      <div className="flex items-center gap-3 border-b border-accent/20 bg-accent/10 px-6 py-4">
        <BadgeCheck className="size-6 shrink-0 text-accent" />
        <div>
          <p className="font-bold tracking-tight">Issued by sydHustle</p>
          <p className="text-sm text-muted-foreground">
            This receipt carries our stamp and has not been altered.
          </p>
        </div>
      </div>

      <dl className="divide-y divide-white/5 px-6">
        <Field label="Amount" value={naira(receipt.amount)} />
        <Field
          label={receipt.direction === "credit" ? "Received by" : "Paid to"}
          value={receipt.counterparty}
        />
        {receipt.workTitle ? (
          <Field label="For" value={receipt.workTitle} />
        ) : null}
        <Field
          label="Description"
          value={REASON_LABELS[receipt.reason] ?? receipt.reason}
        />
        <Field label="Date" value={shortDate(receipt.issuedAt)} />
        <Field label="Transaction ID" mono value={receipt.reference} />
      </dl>

      {(returned || held || ledger !== "match") && (
        <div className="border-t border-white/10 px-6 py-4">
          {ledger === "mismatch" || ledger === "not_found" ? (
            <Notice tone="warn">
              The stamp is ours, but our ledger no longer describes this
              entry the same way. Please contact support@sydhustle.com with
              the transaction ID before relying on it.
            </Notice>
          ) : returned ? (
            <Notice tone="warn">
              This receipt is genuine, but the payment it describes was
              later returned to the sender. It is not evidence that the
              money was kept.
            </Notice>
          ) : held ? (
            <Notice tone="info">
              This payment is still held in escrow. It is committed, and it
              has not yet been released to the person doing the work.
            </Notice>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FailedResult({ verdict }: { verdict: Exclude<Result["verdict"], "valid"> }) {
  const copy = FAILURES[verdict];
  const serious = verdict === "bad_signature";

  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border p-6",
        serious
          ? "border-red-500/30 bg-red-500/5"
          : "border-white/10 bg-white/5"
      )}
    >
      {serious ? (
        <ShieldAlert className="size-6 shrink-0 text-red-400" />
      ) : (
        <ShieldQuestion className="size-6 shrink-0 text-muted-foreground" />
      )}
      <div>
        <p className="font-bold tracking-tight">{copy.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {copy.detail}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right font-semibold",
          mono && "font-mono text-sm tracking-wide"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warn" | "info";
}) {
  return (
    <div className="flex gap-3">
      <AlertTriangle
        className={cn(
          "size-5 shrink-0",
          tone === "warn" ? "text-amber-400" : "text-muted-foreground"
        )}
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
