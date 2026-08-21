/**
 * Shapes and labels for transaction reports, shared by both sides of the
 * client boundary.
 *
 * Deliberately has NO `server-only` marker and imports nothing that does.
 * The queue component is a Client Component and needs the reason labels
 * and the status union; if those lived in `transaction-reports.ts` - which
 * is `server-only` because it holds the Supabase reads - importing them
 * would pull the whole server module into the browser bundle and the build
 * fails with "You're importing a module that depends on server-only".
 *
 * So: types and constants here, queries there. The split is the boundary,
 * not a preference.
 */

export type TransactionReportStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "rejected";

export type TransactionReportReason =
  | "not_received"
  | "withdrawal_missing"
  | "wrong_amount"
  | "duplicate"
  | "unauthorised"
  | "other";

/**
 * The app's own wording, so the console and the phone describe the same
 * complaint in the same words. Mirrors TRANSACTION_REPORT_REASONS in
 * sydHustle's src/features/wallet/services/transaction-service.ts, and the
 * `reason` check constraint on public.transaction_reports.
 */
export const REASON_LABELS: Record<TransactionReportReason, string> = {
  not_received: "Money never arrived",
  withdrawal_missing: "Withdrawal not in my bank",
  wrong_amount: "The amount is wrong",
  duplicate: "Charged twice",
  unauthorised: "Didn't authorise this",
  other: "Something else",
};

export type TransactionReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  reference: string;
  reason: TransactionReportReason;
  detail: string | null;
  /**
   * The receipt as the REPORTER saw it, verbatim.
   *
   * Never re-derive this from the ledger at review time. The ledger may
   * have moved on since they filed - a hold released, a withdrawal
   * reversed - and then the reviewer and the reporter are looking at two
   * different documents while believing they share one.
   */
  receiptSnapshot: string | null;
  status: TransactionReportStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  /**
   * What the ledger says NOW, for the same reference. Shown beside the
   * snapshot rather than instead of it: the difference between the two is
   * usually the whole case.
   */
  ledger: {
    amount: number;
    direction: string;
    reason: string;
    createdAt: string;
    balanceAfter: number | null;
    /**
     * The NIP session ID for this entry, read from the ledger NOW.
     *
     * The reporter's snapshot carries one too, for reports filed after
     * settlement ids existed. This is here for the two cases the snapshot
     * cannot cover: reports filed before they did, and a payout that was
     * still in flight when the user gave up on it and filed — the rail
     * stamps the session id on arrival, so the number that answers the
     * case often lands after the complaint about it.
     */
    settlementId: string | null;
  } | null;
};
