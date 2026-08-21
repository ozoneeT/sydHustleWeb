"use server";

import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Opening a payment from the stamp code on someone's receipt.
 *
 * Every receipt the app shares carries a 16 character authenticity stamp:
 * an HMAC over that entry's material values, signed with a key that lives
 * inside the database and is readable only by a `security definer`
 * function. Nothing outside this action can check one, and nothing outside
 * this company needs to.
 *
 * The check is the door, not the point. A matching code proves the figures
 * being quoted at us are the ones we issued and pins the dispute to one
 * exact ledger row; what comes back is the whole payment behind it, which
 * is what actually answers "they say they were never credited". Both
 * parties, every entry sharing the same source, each wallet before and
 * after, the hold and when it moved, the withdrawal with its provider
 * reference and failure reason.
 *
 * `requireConsole()` first, always: this returns another person's bank
 * account number and both parties' wallet balances.
 */

const schema = z.object({
  reference: z
    .string()
    .trim()
    .min(4, "Enter the transaction ID from the receipt.")
    .max(64),
  code: z
    .string()
    .trim()
    .min(4, "Enter the authenticity stamp code.")
    .max(64),
});

export type LinkedEntry = {
  reference: string;
  direction: "credit" | "debit";
  reason: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
  note: string | null;
  profile_id: string;
  profile_name: string;
  is_subject: boolean;
};

export type ReceiptCheck = {
  verdict: "valid" | "bad_signature" | "not_found" | "unavailable";
  /** What the receipt itself claims, recovered from the signed payload. */
  signed?: {
    reference: string;
    direction: "credit" | "debit";
    amount: number;
    reason: string;
    issuedAt: string;
    counterparty: string;
    workTitle: string;
  };
  entry?: {
    reference: string;
    direction: "credit" | "debit";
    amount: number;
    reason: string;
    note: string | null;
    createdAt: string;
    sourceType: string | null;
    profileId: string;
    /** The NIP session ID, folded in by `withSettlementId` rather than
     * returned by the RPC. The one identifier on this whole result that
     * a bank or a provider's support desk can act on. */
    settlementId?: string | null;
  };
  entries?: LinkedEntry[];
  parties?: {
    role: "payer" | "worker" | "owner";
    profileId: string;
    name: string;
    walletBalance: number | null;
  }[];
  escrow?: {
    id: string;
    kind: "hustle" | "booking";
    sourceId: string;
    status: "held" | "released" | "refunded";
    amount: number;
    fee: number;
    heldAt: string;
    statusChangedAt: string;
  };
  work?: {
    kind: string | null;
    title: string | null;
    status: string | null;
    hustleStatus: string | null;
    appealCause: string | null;
    appealNote: string | null;
  };
  withdrawal?: {
    id: string;
    status: string;
    amount: number;
    fee: number;
    net: number;
    automatic: boolean;
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    provider: string | null;
    providerReference: string | null;
    /** What the BANK can trace, as opposed to `providerReference`, which
     * only Paystack or Payvessel can resolve. Folded in alongside the
     * entry's own copy so the withdrawal block reads on its own. */
    sessionId?: string | null;
    failureReason: string | null;
    requestedAt: string;
    statusChangedAt: string;
  };
};

export type CheckState = {
  error: string | null;
  result: ReceiptCheck | null;
  /** Echoed back so the form can keep what was typed after a failure. */
  reference: string;
  code: string;
};

export async function checkReceiptStamp(
  _previous: CheckState,
  formData: FormData,
): Promise<CheckState> {
  await requireConsole();

  const reference = String(formData.get("reference") ?? "");
  const code = String(formData.get("code") ?? "");
  const parsed = schema.safeParse({ reference, code });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check both fields.",
      result: null,
      reference,
      code,
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("verify_receipt_code", {
    p_reference: parsed.data.reference,
    p_code: parsed.data.code,
    // Recorded against the check in `private.stamp_checks`. A money
    // investigation tool should be able to say who looked at what.
    p_operator: process.env.CONSOLE_EMAIL ?? "console",
  });

  if (error) {
    console.error("[console] verify_receipt_code failed", error);
    return {
      // Named, not hidden behind "see the logs". This is an operator tool:
      // the person reading it can act on "the migration is not applied" and
      // cannot act on a shrug. PGRST202 is PostgREST saying the function is
      // not in its schema cache, which in practice means one of two things.
      error:
        error.code === "PGRST202"
          ? "This database has no `verify_receipt_code` function. Apply supabase/migrations/20260815100000_receipt_stamp.sql, then reload the schema cache (Supabase does that on its own within a minute)."
          : `The check could not run: ${error.message}`,
      result: null,
      reference: parsed.data.reference,
      code: parsed.data.code,
    };
  }

  return {
    error: null,
    result: await withSettlementId(supabase, data as ReceiptCheck),
    reference: parsed.data.reference,
    code: parsed.data.code,
  };
}

/**
 * Folds the NIP settlement ID into a check result.
 *
 * Done HERE rather than inside `verify_receipt_code` on purpose. That
 * function is a 300-line security-definer audit routine that also writes
 * the check to `private.stamp_checks`; replacing its whole body to append
 * two fields would put the tamper-evidence trail at risk for a display
 * detail. This reads the same rows it would have, with the same service
 * key, and cannot affect the verdict - the signature check has already
 * happened and nothing below can change it.
 *
 * A failed lookup degrades to no settlement id rather than to no result.
 * An operator who can see the verdict and the parties but not the tracing
 * number is far better off than one staring at an error.
 */
async function withSettlementId(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  result: ReceiptCheck
): Promise<ReceiptCheck> {
  if (result.verdict !== "valid" || !result.entry) return result;

  try {
    // A withdrawal keeps it on its own row, because it arrives after the
    // append-only ledger entry was written. A checkout deposit keeps it
    // on the intent, for the same reason. Only a virtual-account credit
    // carries it on the entry itself, having had nowhere else to put it.
    const { data: ledger } = await supabase
      .from("wallet_ledger")
      .select("source_type, source_id, settlement_id")
      .eq("reference", result.entry.reference)
      .maybeSingle();

    if (!ledger) return result;

    let settlementId: string | null = ledger.settlement_id ?? null;

    if (!settlementId && ledger.source_id) {
      const table =
        ledger.source_type === "withdrawal"
          ? "withdrawals"
          : ledger.source_type === "payment_intent"
            ? "payment_intents"
            : null;
      if (table) {
        const { data: source } = await supabase
          .from(table)
          .select("session_id")
          .eq("id", ledger.source_id)
          .maybeSingle();
        settlementId = source?.session_id ?? null;
      }
    }

    if (!settlementId) return result;

    return {
      ...result,
      entry: { ...result.entry, settlementId },
      ...(result.withdrawal
        ? { withdrawal: { ...result.withdrawal, sessionId: settlementId } }
        : {}),
    };
  } catch (cause) {
    console.error("[console] settlement id lookup failed", cause);
    return result;
  }
}
