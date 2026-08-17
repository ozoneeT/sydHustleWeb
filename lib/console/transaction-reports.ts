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
  profiles: { display_name: string | null; full_name: string | null; email: string | null } | null;
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
      "id, reporter_id, transaction_reference, reason, detail, receipt_snapshot, status, resolution, created_at, resolved_at, profiles!transaction_reports_reporter_id_fkey(display_name, full_name, email)"
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
    .select("reference, amount, direction, reason, created_at, balance_after")
    .in("reference", [...new Set(rows.map((r) => r.transaction_reference))]);

  const ledgerByRef = new Map(
    (ledgerRows ?? []).map((l) => [
      l.reference as string,
      {
        amount: Number(l.amount),
        direction: String(l.direction),
        reason: String(l.reason),
        createdAt: String(l.created_at),
        balanceAfter: l.balance_after === null ? null : Number(l.balance_after),
      },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    reporterName:
      row.profiles?.display_name ?? row.profiles?.full_name ?? "Someone",
    reporterEmail: row.profiles?.email ?? null,
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
