"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { APP_ROUTE_PATHS } from "@/lib/console/app-routes";
import {
  audienceSchema,
  type AudienceFilters,
} from "@/lib/console/audience";
import { requireConsole } from "@/lib/console/dal";
import { deleteConsoleSession } from "@/lib/console/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function consoleLogout() {
  await deleteConsoleSession();
  redirect("/console");
}

/** Empty means "no cap", which is a different answer from zero — zero
 * would cap every fee at nothing. */
const OPTIONAL_CAP = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.coerce.number().min(0).max(1_000_000).nullable()
);

const earningsSchema = z.object({
  withdrawal_cut_percent: z.coerce.number().min(0).max(30),
  withdrawal_fee_flat: z.coerce.number().min(0).max(100000),
  withdrawal_fee_cap: OPTIONAL_CAP,
  deposit_fee_percent: z.coerce.number().min(0).max(30),
  deposit_fee_flat: z.coerce.number().min(0).max(100000),
  deposit_fee_cap: OPTIONAL_CAP,
  apple_commission_percent: z.coerce.number().min(0).max(50),
  google_commission_percent: z.coerce.number().min(0).max(50),
  escrow_cut_percent: z.coerce.number().min(0).max(30),
  escrow_cut_applies_to: z.enum(["none", "provider", "hustler", "both"]),
  sms_weekly_price: z.coerce.number().min(0).max(10000),
  sms_monthly_price: z.coerce.number().min(0).max(10000),
  /** Whole texts, and never negative - the column's own check refuses
   * that anyway. Integer because half a text is not a thing that can be
   * sent, and a fractional cap would round somewhere the operator
   * cannot see. */
  sms_weekly_cap: z.coerce.number().int().min(0).max(10000),
  sms_monthly_cap: z.coerce.number().int().min(0).max(10000),
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
    withdrawal_fee_flat: formData.get("withdrawal_fee_flat"),
    withdrawal_fee_cap: formData.get("withdrawal_fee_cap"),
    deposit_fee_percent: formData.get("deposit_fee_percent"),
    deposit_fee_flat: formData.get("deposit_fee_flat"),
    deposit_fee_cap: formData.get("deposit_fee_cap"),
    apple_commission_percent: formData.get("apple_commission_percent"),
    google_commission_percent: formData.get("google_commission_percent"),
    escrow_cut_percent: formData.get("escrow_cut_percent"),
    escrow_cut_applies_to: formData.get("escrow_cut_applies_to"),
    sms_weekly_price: formData.get("sms_weekly_price"),
    sms_monthly_price: formData.get("sms_monthly_price"),
    sms_weekly_cap: formData.get("sms_weekly_cap"),
    sms_monthly_cap: formData.get("sms_monthly_cap"),
  });
  if (!parsed.success) {
    return {
      error:
        "Percentages must be 0–30, flat fees 0–100,000, SMS prices 0–10,000, and SMS allowances whole numbers 0–10,000. Leave a fee cap blank for no cap.",
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
  // Every surface that prices money reads these: the app's withdraw and
  // Add Cash screens, the payments page's rate card, and the P&L.
  revalidatePath("/console/earnings");
  revalidatePath("/console/payments");
  return { error: null, saved: true };
}

const providersSchema = z.object({
  funding_provider: z.enum(["paystack", "payvessel"]),
  payout_provider: z.enum(["paystack", "payvessel"]),
});

export type ProvidersState = { error: string | null; saved: boolean };

/**
 * Moves a rail to a different payment provider.
 *
 * Takes effect on the NEXT deposit and the NEXT withdrawal, and on
 * nothing that is already moving. Every payment intent and every
 * withdrawal row carries the provider it was started with, and the
 * functions that settle them dispatch on that stamp rather than on this
 * setting - so flipping a rail mid-transfer cannot strand money at the
 * old provider. Both providers' webhooks stay deployed for the same
 * reason.
 *
 * Two things do change for users straight away, and both are deliberate:
 *   - Add Cash draws the methods the new funding provider supports.
 *   - Withdrawal banks saved against the old payout provider ask to be
 *     confirmed again, because a bank code belongs to one provider's list
 *     and Paystack additionally needs a recipient Payvessel never mints.
 *     Until a bank is confirmed it cannot be withdrawn to, and the
 *     automatic sweep skips it with a notification rather than failing a
 *     transfer.
 *
 * So this is not a setting to toggle idly on a live business. It is the
 * one to change when a provider goes live, or has to be taken out of
 * service.
 */
export async function updatePaymentProviders(
  _prev: ProvidersState,
  formData: FormData
): Promise<ProvidersState> {
  await requireConsole();

  const parsed = providersSchema.safeParse({
    funding_provider: formData.get("funding_provider"),
    payout_provider: formData.get("payout_provider"),
  });
  if (!parsed.success) {
    return { error: "Pick a provider for each rail.", saved: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    return { error: error.message, saved: false };
  }
  revalidatePath("/console/payments");
  return { error: null, saved: true };
}

const kycSchema = z.object({
  nin_provider: z.enum(["interswitch", "payvessel"]),
  bvn_provider: z.enum(["interswitch", "payvessel"]),
});

export type KycState = { error: string | null; saved: boolean };

/**
 * Points the identity checks at a provider.
 *
 * Takes effect on the NEXT lookup and changes nothing already verified.
 * The cached encrypted records survive it too: a record is a record,
 * whoever found it, so a retry after a switch is still free.
 *
 * The NIN rail is not a free choice. A provider whose record carries no
 * state of origin cannot prove the fourth factor of the knowledge
 * check - see NIN_CHECKS_STATE and the warning the form shows.
 */
export async function updateKycProviders(
  _prev: KycState,
  formData: FormData
): Promise<KycState> {
  await requireConsole();

  const parsed = kycSchema.safeParse({
    nin_provider: formData.get("nin_provider"),
    bvn_provider: formData.get("bvn_provider"),
  });
  if (!parsed.success) {
    return { error: "Pick a provider for each check.", saved: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    return { error: error.message, saved: false };
  }
  revalidatePath("/console/payments");
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
  note: z.string().trim().max(200).optional(),
});

export type BroadcastState = {
  error: string | null;
  sent: number | null;
};

/**
 * Read the audience out of the form.
 *
 * The filters travel as one JSON field rather than as fifteen form
 * inputs: the shape is nested (a list of ids, optional day counts) and
 * flattening it into form keys would mean encoding and decoding it in
 * two places that could disagree. Anything malformed is rejected rather
 * than coerced, because the failure mode of a silently-dropped filter
 * is sending to more people than the operator chose.
 */
function parseFilters(raw: FormDataEntryValue | null): AudienceFilters | null {
  if (typeof raw !== "string" || raw.trim() === "") return {};
  try {
    const parsed = audienceSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * How many people a filter set currently selects, plus a few names to
 * check it against.
 *
 * The form calls this as the operator changes the filters, so the count
 * on screen is always the count the send would produce. It is a fresh
 * query every time rather than a cached one for the same reason.
 */
export async function previewBroadcastAudience(
  filters: AudienceFilters
): Promise<{ count: number; reachable: number; sample: { id: string; name: string }[] }> {
  await requireConsole();

  const parsed = audienceSchema.safeParse(filters);
  if (!parsed.success) return { count: 0, reachable: 0, sample: [] };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_broadcast_preview", {
    p_filters: parsed.data,
  });
  if (error) throw new Error(error.message);

  const result = (data ?? {}) as {
    count?: number;
    reachable?: number;
    sample?: { id: string; name: string }[];
  };
  return {
    count: result.count ?? 0,
    reachable: result.reachable ?? 0,
    sample: result.sample ?? [],
  };
}

/**
 * Name search for the "specific people" field.
 *
 * Names only, and only the ones already visible on the console's users
 * page. Emails are deliberately not returned: picking a recipient does
 * not need one, and a search box that hands them out is a search box
 * that leaks them into a browser tab.
 */
export async function searchBroadcastRecipients(
  query: string
): Promise<{ id: string; name: string; school: string | null }[]> {
  await requireConsole();

  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, school")
    .or(`full_name.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(10);
  if (error) throw new Error(error.message);

  return (
    (data ?? []) as {
      id: string;
      full_name: string | null;
      display_name: string | null;
      school: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.display_name?.trim() || row.full_name?.trim() || "Unnamed",
    school: row.school,
  }));
}

/**
 * Send an announcement to a targeted audience.
 *
 * The audience is resolved inside the database function, in the same
 * statement that writes the notifications, so nobody can join or leave
 * the segment between the preview the operator confirmed and the rows
 * that actually go out.
 *
 * Type `system`, as before: these sit outside the per-type preferences
 * in the app's Settings because a service announcement is not a
 * category anybody opted into. Targeting one narrowly does not change
 * what may be said in it. Promotional push still needs an explicit
 * opt-in that the app does not yet collect.
 */
export async function sendBroadcast(
  _prev: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  await requireConsole();

  const parsed = broadcastSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    note: formData.get("note") || undefined,
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

  const filters = parseFilters(formData.get("filters"));
  if (!filters) {
    return { error: "That audience isn't valid. Reset it and try again.", sent: null };
  }

  // The app's router ignores a path it does not recognise, so an
  // unlisted one produces a notification that opens nothing at all.
  const url = String(formData.get("url") ?? "").trim() || "/notifications";
  if (!APP_ROUTE_PATHS.includes(url)) {
    return { error: "That screen isn't one the app can open.", sent: null };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_send_broadcast", {
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_url: url,
    p_filters: filters,
    p_note: parsed.data.note ?? null,
  });
  if (error) {
    return { error: `Nothing was sent: ${error.message}`, sent: null };
  }

  const sent = ((data ?? {}) as { recipients?: number }).recipients ?? 0;

  revalidatePath("/console/broadcast");
  return { error: null, sent };
}
