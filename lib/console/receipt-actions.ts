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
    result: data as ReceiptCheck,
    reference: parsed.data.reference,
    code: parsed.data.code,
  };
}
