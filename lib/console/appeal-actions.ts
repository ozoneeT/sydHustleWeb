"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Both actions re-check the console session first — a server action is a
 * public endpoint, and these two move money and speak for the platform. */

const kindSchema = z.enum(["hustle", "booking"]);

const messageSchema = z.object({
  kind: kindSchema,
  sourceId: z.string().uuid(),
  /** Admin messages must name a side; that's what keeps the two halves of
   * the hearing apart. */
  recipientRole: z.enum(["provider", "hustler"]),
  body: z.string().trim().min(1).max(4000),
});

export type AppealMessageState = { error: string | null; sent: boolean };

export async function sendAppealMessage(
  _prev: AppealMessageState,
  formData: FormData
): Promise<AppealMessageState> {
  await requireConsole();

  const parsed = messageSchema.safeParse({
    kind: formData.get("kind"),
    sourceId: formData.get("sourceId"),
    recipientRole: formData.get("recipientRole"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: "Pick who this is for and write a message.", sent: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("appeal_messages").insert({
    kind: parsed.data.kind,
    source_id: parsed.data.sourceId,
    author_role: "admin",
    author_profile_id: null,
    recipient_role: parsed.data.recipientRole,
    body: parsed.data.body,
  });
  if (error) {
    return { error: error.message, sent: false };
  }

  revalidatePath(`/console/appeals/${parsed.data.kind}/${parsed.data.sourceId}`);
  return { error: null, sent: true };
}

const resolveSchema = z.object({
  kind: kindSchema,
  sourceId: z.string().uuid(),
  awardedTo: z.enum(["provider", "hustler"]),
  note: z.string().trim().max(2000).optional(),
  /** Typed by the admin. A mis-click here pays the wrong person and there
   * is no undo, so the decision has to be spelled out. */
  confirm: z.string(),
});

export type ResolveAppealState = { error: string | null; resolved: boolean };

export async function resolveAppeal(
  _prev: ResolveAppealState,
  formData: FormData
): Promise<ResolveAppealState> {
  await requireConsole();

  const parsed = resolveSchema.safeParse({
    kind: formData.get("kind"),
    sourceId: formData.get("sourceId"),
    awardedTo: formData.get("awardedTo"),
    note: formData.get("note") ?? undefined,
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: "Choose who the money goes to.", resolved: false };
  }
  if (parsed.data.confirm.trim().toUpperCase() !== "AWARD") {
    return { error: "Type AWARD to confirm the decision.", resolved: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("resolve_appeal", {
    p_kind: parsed.data.kind,
    p_source_id: parsed.data.sourceId,
    p_awarded_to: parsed.data.awardedTo,
    p_note: parsed.data.note ?? null,
  });
  if (error) {
    // The database's own refusals are the useful ones here.
    const message = error.message.includes("already_resolved")
      ? "This appeal has already been decided."
      : error.message;
    return { error: message, resolved: false };
  }

  revalidatePath("/console/appeals");
  revalidatePath(`/console/appeals/${parsed.data.kind}/${parsed.data.sourceId}`);
  return { error: null, resolved: true };
}
