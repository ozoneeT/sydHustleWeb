"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReportActionState = { error: string | null; done: boolean };

/**
 * Closing a report.
 *
 * Three outcomes, and they mean genuinely different things:
 *
 *   actioned  — the report was right and something was done about the
 *               content or the account.
 *   reviewed  — a human looked, and it needs no action but isn't
 *               nonsense either. The honest middle, and the one that
 *               stops "dismissed" from quietly meaning "read".
 *   dismissed — nothing wrong here.
 *
 * The note is optional, unlike a review appeal's, because nobody is
 * sent it — see the migration. It exists so that "why did we dismiss
 * forty harassment reports last month" has an answer.
 *
 * Enforcement itself is deliberately NOT wired in here. Removing a
 * Hustle, hiding a Skill or suspending an account are separate,
 * heavier actions with their own paths, and a status dropdown that
 * silently deleted someone's listing would be the wrong shape for
 * them. This records the decision; acting on it is still a human
 * going to the thing and doing it.
 */
const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewed", "actioned", "dismissed"]),
  note: z.string().trim().max(1000).optional(),
});

export async function resolveReport(
  _prev: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  await requireConsole();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    note: formData.get("note")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { error: "That decision didn't look right. Try again.", done: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("resolve_report", {
    p_report_id: parsed.data.id,
    p_status: parsed.data.status,
    p_note: parsed.data.note ?? null,
  });

  if (error) {
    return {
      error: error.message.includes("unknown_report")
        ? "That report no longer exists."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/reports");
  return { error: null, done: true };
}
