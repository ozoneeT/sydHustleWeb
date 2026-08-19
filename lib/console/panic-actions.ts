"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PanicActionState = { error: string | null; done: boolean };

/**
 * Standing down somebody else's alarm.
 *
 * The note is required by the database, not just by this schema, and it is
 * the point of the action rather than paperwork around it. Clearing an
 * alert unfreezes the entire booking for both parties, and it is the only
 * place in this console where an operator overrides a person's own
 * statement that they were in danger. Six months later the only thing
 * anybody will have to judge that call by is this sentence.
 *
 * Write who was spoken to and how they were identified: "Rang Ifemi
 * (sister, on file) 21:40, she had spoken to David, he is home" decides
 * itself on review. "Confirmed safe" does not.
 */
const clearSchema = z.object({
  id: z.string().uuid(),
  note: z.string().trim().min(10).max(500),
});

export async function clearPanicAlert(
  _prev: PanicActionState,
  formData: FormData
): Promise<PanicActionState> {
  await requireConsole();

  const parsed = clearSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      error:
        "Say who you spoke to and how you know they are safe — at least 10 characters. It is the record of this decision.",
      done: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("clear_panic_alert_as_desk", {
    p_alert: parsed.data.id,
    p_note: parsed.data.note,
  });

  if (error) {
    return {
      error: error.message.includes("no_active_alert")
        ? "That alert is already closed."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/panic");
  return { error: null, done: true };
}

/**
 * Decide an appeal against a hold.
 *
 * Separate from clearing the alert, and the separation matters. Upholding
 * an appeal says the hold was wrong; clearing an alarm says a person is
 * safe. They are usually the same conclusion, and an operator who could
 * only do both at once would start doing the wrong one to achieve the
 * other. Upholding an appeal does NOT unfreeze the booking — clear the
 * alert for that, once you have actually confirmed it.
 */
const decideSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["upheld", "rejected"]),
  note: z.string().trim().min(10).max(500),
});

export async function decideHoldAppeal(
  _prev: PanicActionState,
  formData: FormData
): Promise<PanicActionState> {
  await requireConsole();

  const parsed = decideSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return {
      error: "Pick an outcome and write a reason of at least 10 characters.",
      done: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("decide_hold_appeal", {
    p_appeal: parsed.data.id,
    p_note: parsed.data.note,
    p_status: parsed.data.status,
  });

  if (error) {
    return {
      error: error.message.includes("no_pending_appeal")
        ? "That appeal has already been decided."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/panic");
  return { error: null, done: true };
}
