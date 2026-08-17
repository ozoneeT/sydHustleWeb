"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Deciding a transaction report.
 *
 * `requireConsole()` first, always: a server action is a public endpoint,
 * and this one speaks for the platform about somebody's money.
 *
 * The app has no update policy on `transaction_reports` - a dispute is a
 * record of what someone said at the time, and a reporter who could edit
 * or delete it after the fact would make it useless as evidence. So every
 * transition happens here, through the service role.
 */

const decisionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "investigating", "resolved", "rejected"]),
  /**
   * Required to close, optional to reopen or park.
   *
   * A case that ends with no explanation is one the reporter cannot act
   * on and support cannot answer questions about - so closing without
   * words is refused rather than allowed and regretted.
   */
  resolution: z.string().trim().max(1000).optional(),
});

export type TransactionReportState = { error: string | null; saved: boolean };

export async function decideTransactionReport(
  _prev: TransactionReportState,
  formData: FormData
): Promise<TransactionReportState> {
  await requireConsole();

  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    resolution: formData.get("resolution") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "That decision didn't look right. Try again.", saved: false };
  }

  const { id, status, resolution } = parsed.data;
  const closing = status === "resolved" || status === "rejected";

  if (closing && !resolution) {
    return {
      error:
        "Say what you decided. The reporter sees this, and support answers from it.",
      saved: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("transaction_reports")
    .update({
      status,
      resolution: resolution ?? null,
      // Stamped on close, cleared on reopen, so `resolved_at` always means
      // "this is when it stopped being open" rather than "it was closed
      // once, some time ago".
      resolved_at: closing ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { error: "Couldn't save that. Try again.", saved: false };
  }

  revalidatePath("/console/transaction-reports");
  return { error: null, saved: true };
}
