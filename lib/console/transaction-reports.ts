import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  TransactionReport,
  TransactionReportReason,
  TransactionReportStatus,
} from "@/lib/console/transaction-report-types";

/**
 * Transaction reports — someone saying a payment went wrong.
 *
 * Deliberately separate from the moderation queue. `public.reports` is the
 * safety taxonomy (harassment, explicit content, impersonation) over
 * messages and profiles; a payment that never arrived filed there would
 * sit behind content review, described by a reason that cannot express it,
 * in front of a reviewer with no way to look the money up.
 *
 * These are also NOT appeals. An appeal is two users disagreeing about
 * whether work was done, with escrow frozen until someone decides. A
 * report is one user saying the platform's own record looks wrong to them:
 * money that left and never landed, a figure that does not match, a charge
 * nobody recognises. Different question, different evidence, different fix.
 */

export type {
  TransactionReport,
  TransactionReportReason,
  TransactionReportStatus,
} from "@/lib/console/transaction-report-types";
export { REASON_LABELS } from "@/lib/console/transaction-report-types";

type ReportRow = {
  id: string;
  reporter_id: string;
  transaction_reference: string;
  reason: TransactionReportReason;
  detail: string | null;
  receipt_snapshot: string | null;
  status: TransactionReportStatus;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  profiles: { display_name: string | null; full_name: string | null } | null;
};

/**
 * The queue, newest first, unresolved before resolved.
 *
 * Ordered in SQL rather than in the component so the "oldest open case"
 * question has one answer wherever it is asked.
 */
export async function listTransactionReports(
  status?: TransactionReportStatus
): Promise<TransactionReport[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("transaction_reports")
    .select(
      "id, reporter_id, transaction_reference, reason, detail, receipt_snapshot, status, resolution, created_at, resolved_at, profiles!transaction_reports_reporter_id_fkey(display_name, full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ReportRow[];
  if (rows.length === 0) return [];

  // One round trip for every referenced entry rather than one per row.
  const { data: ledgerRows } = await supabase
    .from("wallet_ledger")
    .select(
      "reference, amount, direction, reason, created_at, balance_after, source_type, source_id, settlement_id"
    )
    .in("reference", [...new Set(rows.map((r) => r.transaction_reference))]);

  const entries = (ledgerRows ?? []) as {
    reference: string;
    amount: number | string;
    direction: string;
    reason: string;
    created_at: string;
    balance_after: number | string | null;
    source_type: string | null;
    source_id: string | null;
    settlement_id: string | null;
  }[];

  // The settlement id lives on the ledger row only for a virtual-account
  // credit; a withdrawal or a checkout deposit keeps it on the row the
  // entry points at, because it arrives after the append-only entry was
  // written. Both are folded in here so the reviewer sees one field and
  // never has to know which kind of entry produced it.
  const sessionBySource = new Map<string, string | null>();
  const idsOf = (type: string) => [
    ...new Set(
      entries
        .filter((entry) => entry.source_type === type && entry.source_id)
        .map((entry) => entry.source_id as string)
    ),
  ];

  const withdrawalIds = idsOf("withdrawal");
  if (withdrawalIds.length > 0) {
    const { data: withdrawals } = await supabase
      .from("withdrawals")
      .select("id, session_id")
      .in("id", withdrawalIds);
    for (const w of withdrawals ?? []) {
      sessionBySource.set(`withdrawal:${w.id}`, w.session_id);
    }
  }

  const intentIds = idsOf("payment_intent");
  if (intentIds.length > 0) {
    const { data: intents } = await supabase
      .from("payment_intents")
      .select("id, session_id")
      .in("id", intentIds);
    for (const intent of intents ?? []) {
      sessionBySource.set(`payment_intent:${intent.id}`, intent.session_id);
    }
  }

  const ledgerByRef = new Map(
    entries.map((l) => [
      l.reference,
      {
        amount: Number(l.amount),
        direction: String(l.direction),
        reason: String(l.reason),
        createdAt: String(l.created_at),
        balanceAfter: l.balance_after === null ? null : Number(l.balance_after),
        settlementId:
          l.settlement_id ??
          (l.source_type && l.source_id
            ? sessionBySource.get(`${l.source_type}:${l.source_id}`) ?? null
            : null),
      },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    reporterName:
      row.profiles?.display_name ?? row.profiles?.full_name ?? "Someone",
    reference: row.transaction_reference,
    reason: row.reason,
    detail: row.detail,
    receiptSnapshot: row.receipt_snapshot,
    status: row.status,
    resolution: row.resolution,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    ledger: ledgerByRef.get(row.transaction_reference) ?? null,
  }));
}

/** Counts for the queue's filter chips, so a reviewer can see there is
 * work waiting without opening each tab to find out. */
export async function transactionReportCounts(): Promise<
  Record<TransactionReportStatus, number>
> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("transaction_reports")
    .select("status");
  if (error) throw error;

  const counts: Record<TransactionReportStatus, number> = {
    open: 0,
    investigating: 0,
    resolved: 0,
    rejected: 0,
  };
  for (const row of data ?? []) {
    const status = (row as { status: TransactionReportStatus }).status;
    if (status in counts) counts[status] += 1;
  }
  return counts;
}
