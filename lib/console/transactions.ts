import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The transaction record, three levels deep.
 *
 * Everything here comes out of one RPC per level
 * (`console_transaction_users`, `console_user_transactions`,
 * `console_transaction_detail`), because the detail of a single entry
 * lives in up to nine tables and which ones depends on what kind of
 * movement it was. Assembling that in SQL is one round trip next to the
 * data; assembling it here would be nine, in a place that cannot see
 * the constraints.
 *
 * The shapes below are therefore deliberately loose. They describe what
 * the SQL builds, and the pages render whatever arrived — a field the
 * database could not fill comes through as null and is shown as
 * "not recorded" rather than hidden, because on an evidentiary record
 * the difference between "zero" and "we never captured it" matters.
 */

export type TransactionUser = {
  profile_id: string;
  display_name: string | null;
  email: string | null;
  entries: number;
  credits: number;
  debits: number;
  total_in: number;
  total_out: number;
  last_at: string;
  balance: number | null;
  restricted: number | null;
};

export type LedgerEntry = {
  id: string;
  reference: string;
  direction: "credit" | "debit";
  amount: number;
  reason: string;
  balance_after: number;
  balance_before: number;
  note: string | null;
  provider_reference: string | null;
  settlement_id: string | null;
  created_at: string;
};

export type TransactionProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  identity_verified: boolean;
  bvn_verified: boolean;
  balance: number | null;
  restricted: number | null;
};

/** The detail payload, as assembled by `console_transaction_detail`.
 * Sections are present only when they apply to the entry's reason. */
export type TransactionDetail = {
  entry: Record<string, unknown>;
  account: Record<string, unknown> | null;
  deposit?: Record<string, unknown> | null;
  withdrawal?: Record<string, unknown> | null;
  escrow?: Record<string, unknown> | null;
  location?: Record<string, unknown> | null;
  refund?: Record<string, unknown> | null;
  revenue: Record<string, unknown>[];
  provider_charges: Record<string, unknown>[];
  reports: Record<string, unknown>[];
};

export async function listTransactionUsers(
  search?: string
): Promise<TransactionUser[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_transaction_users", {
    p_search: search?.trim() || null,
    p_limit: 200,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionUser[];
}

export async function getUserTransactions(profileId: string): Promise<{
  profile: TransactionProfile | null;
  entries: LedgerEntry[];
}> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_user_transactions", {
    p_profile_id: profileId,
    p_limit: 500,
  });
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as {
    profile?: TransactionProfile | null;
    entries?: LedgerEntry[];
  };
  return { profile: row.profile ?? null, entries: row.entries ?? [] };
}

export async function getTransactionDetail(
  reference: string
): Promise<TransactionDetail | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_transaction_detail", {
    p_reference: reference,
  });
  if (error) throw new Error(error.message);
  return (data as TransactionDetail | null) ?? null;
}

/** The app's own wording for a ledger reason, so the console and the
 * phone describe one movement the same way. */
export const REASON_LABELS: Record<string, string> = {
  deposit: "Money added",
  withdrawal: "Withdrawal",
  withdrawal_reversal: "Withdrawal refunded",
  escrow_hold: "Locked for a Hustle",
  escrow_release: "Released for work done",
  escrow_refund: "Escrow refunded",
  deposit_refund: "Deposit sent back",
  fee: "Fee",
  adjustment: "Adjustment",
};
