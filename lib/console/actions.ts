"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { deleteConsoleSession } from "@/lib/console/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function consoleLogout() {
  await deleteConsoleSession();
  redirect("/console");
}

const earningsSchema = z.object({
  withdrawal_cut_percent: z.coerce.number().min(0).max(30),
  escrow_cut_percent: z.coerce.number().min(0).max(30),
  escrow_cut_applies_to: z.enum(["none", "provider", "hustler", "both"]),
  sms_daily_price: z.coerce.number().min(0).max(10000),
  sms_weekly_price: z.coerce.number().min(0).max(10000),
  sms_monthly_price: z.coerce.number().min(0).max(10000),
});

export type EarningsState = { error: string | null; saved: boolean };

/**
 * Updates the platform's fee schedule. Takes effect immediately for NEW
 * withdrawals and NEW dispute refunds — anything already in flight keeps
 * the fee snapshotted when it was created.
 */
export async function updateEarningsSettings(
  _prev: EarningsState,
  formData: FormData
): Promise<EarningsState> {
  await requireConsole();

  const parsed = earningsSchema.safeParse({
    withdrawal_cut_percent: formData.get("withdrawal_cut_percent"),
    escrow_cut_percent: formData.get("escrow_cut_percent"),
    escrow_cut_applies_to: formData.get("escrow_cut_applies_to"),
    sms_daily_price: formData.get("sms_daily_price"),
    sms_weekly_price: formData.get("sms_weekly_price"),
    sms_monthly_price: formData.get("sms_monthly_price"),
  });
  if (!parsed.success) {
    return {
      error: "Percentages must be 0–30 and SMS prices 0–10,000.",
      saved: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    return { error: error.message, saved: false };
  }
  return { error: null, saved: true };
}

const costSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2, "Name is too short").max(80),
    category: z.enum(["service", "maintenance", "promotion", "publicity", "other"]),
    kind: z.enum(["recurring", "one_off"]),
    cycle: z.enum(["monthly", "yearly"]).optional(),
    started_on: z.string().optional(),
    spent_on: z.string().optional(),
    currency: z.enum(["NGN", "USD"]),
    amount: z.coerce.number().positive("Amount must be above zero"),
    fx_rate: z.coerce.number().positive().optional(),
    note: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.kind !== "recurring" || v.cycle, {
    message: "Pick monthly or yearly for a recurring service.",
  })
  .refine((v) => v.kind !== "one_off" || v.spent_on, {
    message: "Pick the date the money was spent.",
  })
  .refine((v) => v.currency !== "USD" || (v.fx_rate && v.fx_rate > 0), {
    message: "A dollar cost needs the exchange rate you paid at.",
  });

export type CostFormState = { error: string | null; saved: boolean };

/** Records a cost — or corrects one, when an id rides along. The naira
 * value is converted and frozen at entry (or re-entry): rates move, but
 * what something cost when it was paid does not. */
export async function addCost(
  _prev: CostFormState,
  formData: FormData
): Promise<CostFormState> {
  await requireConsole();

  const parsed = costSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    category: formData.get("category"),
    kind: formData.get("kind"),
    cycle: formData.get("cycle") || undefined,
    started_on: formData.get("started_on") || undefined,
    spent_on: formData.get("spent_on") || undefined,
    currency: formData.get("currency"),
    amount: formData.get("amount"),
    fx_rate: formData.get("fx_rate") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form.",
      saved: false,
    };
  }
  const v = parsed.data;

  const amountNgn =
    v.currency === "USD"
      ? Math.round(v.amount * (v.fx_rate ?? 0) * 100) / 100
      : v.amount;

  const row = {
    name: v.name,
    category: v.category,
    kind: v.kind,
    cycle: v.kind === "recurring" ? v.cycle : null,
    started_on:
      v.kind === "recurring"
        ? (v.started_on ?? new Date().toISOString().slice(0, 10))
        : null,
    spent_on: v.kind === "one_off" ? v.spent_on : null,
    currency: v.currency,
    amount: v.amount,
    fx_rate: v.currency === "USD" ? v.fx_rate : null,
    amount_ngn: amountNgn,
    note: v.note ?? null,
  };

  const supabase = createServerSupabaseClient();
  const { error } = v.id
    ? await supabase
        .from("platform_costs")
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("id", v.id)
    : await supabase.from("platform_costs").insert(row);
  if (error) return { error: error.message, saved: false };

  revalidatePath("/console/costs");
  revalidatePath("/console/earnings");
  if (v.id) {
    // Corrections go straight back to the clean list.
    redirect("/console/costs");
  }
  return { error: null, saved: true };
}

/** A recurring service you stopped paying for: accrual stops today,
 * the history stays on the books. */
export async function endCost(formData: FormData) {
  await requireConsole();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createServerSupabaseClient();
  await supabase
    .from("platform_costs")
    .update({
      active: false,
      ended_on: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("kind", "recurring");

  revalidatePath("/console/costs");
  revalidatePath("/console/earnings");
}

/** For entry mistakes only — a real cost that ended should be ended, not
 * erased, or the books rewrite history. */
export async function deleteCost(formData: FormData) {
  await requireConsole();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createServerSupabaseClient();
  await supabase.from("platform_costs").delete().eq("id", id);

  revalidatePath("/console/costs");
  revalidatePath("/console/earnings");
}

const broadcastSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(80),
  body: z.string().trim().min(10, "Message is too short").max(500),
});

export type BroadcastState = {
  error: string | null;
  sent: number | null;
};

/**
 * Sends an announcement to every user: one `notifications` row per
 * profile, which the existing per-row trigger fans out to push tokens.
 * Type `system` — it is not one of the per-type mutable preferences,
 * because a service announcement is not a marketing category. Use
 * sparingly: the app promises users it never sends promotional pushes.
 */
export async function sendBroadcast(
  _prev: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  await requireConsole();

  const parsed = broadcastSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form.",
      sent: null,
    };
  }
  if (formData.get("confirm") !== "on") {
    return { error: "Tick the confirmation box first.", sent: null };
  }

  const supabase = createServerSupabaseClient();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id");
  if (profilesError) {
    return { error: "Couldn't load the recipient list.", sent: null };
  }

  const rows = (profiles ?? []).map((profile) => ({
    profile_id: profile.id,
    type: "system",
    title: parsed.data.title,
    body: parsed.data.body,
    data: { url: "/notifications" },
  }));

  let sent = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("notifications").insert(chunk);
    if (error) {
      return {
        error: `Stopped after ${sent} of ${rows.length} — ${error.message}`,
        sent,
      };
    }
    sent += chunk.length;
  }

  return { error: null, sent };
}
