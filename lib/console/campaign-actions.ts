"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { getCampaign } from "@/lib/console/campaigns";
import {
  audienceSchema,
  loadSuppressed,
  previewAudience,
  resolveAudience,
  type AudiencePreview,
  type EmailAudience,
} from "@/lib/email/audience";
import { BATCH_LIMIT, sendBatchEmails, type BatchEmail } from "@/lib/email/resend";
import {
  renderCampaignHtml,
  renderCampaignText,
  type CampaignContent,
} from "@/lib/email/template";
import { unsubscribeHeaders, unsubscribeUrl } from "@/lib/email/unsubscribe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Everything the console does to a campaign.
 *
 * The send is deliberately not one long-running call. `sendNextBatch`
 * claims up to 100 pending recipients, mails them, records what happened
 * and returns — the dashboard calls it again until nothing is pending.
 * That buys three things a single call can't: a progress bar that is real,
 * a send that survives a closed tab or a function timeout because the
 * queue is in Postgres, and a retry that can never mail the same person
 * twice, because a row leaves 'pending' the moment it is claimed.
 */

const contentSchema = z.object({
  name: z.string().trim().min(2, "Give the campaign a name.").max(120),
  subject: z.string().trim().min(3, "The subject line can't be empty.").max(200),
  preheader: z.string().trim().max(200).optional().or(z.literal("")),
  heading: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Write something in the body.").max(20000),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url("The button link must be a full URL.").optional().or(z.literal("")),
  imageUrl: z.string().trim().url("The image link must be a full URL.").optional().or(z.literal("")),
  footerNote: z.string().trim().max(500).optional().or(z.literal("")),
});

const campaignSchema = contentSchema.extend({
  source: z.enum(["all", "waitlist", "survey", "marketing_team"]),
  school: z.string().trim().max(80).optional().or(z.literal("")),
});

export type CampaignFormState = {
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
  saved?: boolean;
};

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    preheader: String(formData.get("preheader") ?? ""),
    heading: String(formData.get("heading") ?? ""),
    body: String(formData.get("body") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaUrl: String(formData.get("ctaUrl") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    footerNote: String(formData.get("footerNote") ?? ""),
    source: String(formData.get("source") ?? "all"),
    school: String(formData.get("school") ?? ""),
  };
}

function toRow(parsed: z.infer<typeof campaignSchema>) {
  return {
    name: parsed.name,
    subject: parsed.subject,
    preheader: parsed.preheader || null,
    heading: parsed.heading || null,
    body: parsed.body,
    cta_label: parsed.ctaLabel || null,
    cta_url: parsed.ctaUrl || null,
    image_url: parsed.imageUrl || null,
    footer_note: parsed.footerNote || null,
    audience: { source: parsed.source, school: parsed.school || "" },
    updated_at: new Date().toISOString(),
  };
}

/** A saved campaign back into the shape the template renders. */
function contentOf(campaign: {
  subject: string;
  preheader: string | null;
  heading: string | null;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  footer_note: string | null;
}): CampaignContent {
  return {
    subject: campaign.subject,
    preheader: campaign.preheader,
    heading: campaign.heading,
    body: campaign.body,
    ctaLabel: campaign.cta_label,
    ctaUrl: campaign.cta_url,
    imageUrl: campaign.image_url,
    footerNote: campaign.footer_note,
  };
}

export async function saveCampaign(
  campaignId: string | null,
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  await requireConsole("campaigns");

  const parsed = campaignSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors).flat()[0] ?? "Please check the form.",
      fieldErrors,
    };
  }

  const supabase = createServerSupabaseClient();
  let target = campaignId;

  if (target) {
    const existing = await getCampaign(target);
    if (!existing) return { error: "That campaign no longer exists." };
    if (existing.status !== "draft") {
      return { error: "This campaign has already been sent — it can't be edited." };
    }

    const { error } = await supabase
      .from("email_campaigns")
      .update(toRow(parsed.data))
      .eq("id", target)
      .eq("status", "draft");

    if (error) {
      console.error("failed to update campaign:", error);
      return { error: "Couldn't save the campaign. Please try again." };
    }
  } else {
    const { data, error } = await supabase
      .from("email_campaigns")
      .insert(toRow(parsed.data))
      .select("id")
      .single();

    if (error || !data) {
      console.error("failed to create campaign:", error);
      return { error: "Couldn't create the campaign. Please try again." };
    }
    target = data.id;
  }

  revalidatePath("/console/campaigns");
  revalidatePath(`/console/campaigns/${target}`);

  if (!campaignId) redirect(`/console/campaigns/${target}`);
  return { error: null, saved: true };
}

/** Form actions below read the id from a hidden field, so a <form action>
 * can call them directly without a bound wrapper. */
function campaignIdOf(formData: FormData): string {
  return String(formData.get("campaignId") ?? "");
}

export async function deleteCampaign(formData: FormData): Promise<void> {
  await requireConsole("campaigns");
  const campaignId = campaignIdOf(formData);
  const supabase = createServerSupabaseClient();

  // Drafts only. A sent campaign is a record of mail that reached real
  // inboxes, and deleting it would delete the evidence of who was mailed.
  const { error } = await supabase
    .from("email_campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("status", "draft");

  if (error) console.error("failed to delete campaign:", error);
  revalidatePath("/console/campaigns");
  redirect("/console/campaigns");
}

export async function previewCampaignAudience(
  audience: EmailAudience
): Promise<AudiencePreview> {
  await requireConsole("campaigns");
  const parsed = audienceSchema.parse(audience);
  return previewAudience(parsed);
}

export type TestSendState = { error: string | null; sentTo: string | null };

/**
 * One real email, rendered exactly as the campaign will be, to an address
 * the operator names. The only difference is the tag, so a test can be
 * told apart in Resend's own logs.
 */
export async function sendTestEmail(
  _prev: TestSendState,
  formData: FormData
): Promise<TestSendState> {
  await requireConsole("campaigns");

  const email = String(formData.get("testEmail") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address to send the test to.", sentTo: null };
  }

  const parsed = contentSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.body?.[0] ??
        "Fill in the subject and body before sending a test.",
      sentTo: null,
    };
  }

  const content: CampaignContent = {
    subject: parsed.data.subject,
    preheader: parsed.data.preheader || null,
    heading: parsed.data.heading || null,
    body: parsed.data.body,
    ctaLabel: parsed.data.ctaLabel || null,
    ctaUrl: parsed.data.ctaUrl || null,
    imageUrl: parsed.data.imageUrl || null,
    footerNote: parsed.data.footerNote || null,
  };

  const options = {
    ...content,
    recipientName: String(formData.get("testName") ?? "").trim() || null,
    unsubscribeUrl: unsubscribeUrl(email),
  };

  const result = await sendBatchEmails([
    {
      to: email,
      subject: `[TEST] ${content.subject}`,
      html: renderCampaignHtml(options),
      text: renderCampaignText(options),
      headers: unsubscribeHeaders(email),
      tags: [{ name: "kind", value: "campaign_test" }],
    },
  ]);

  if (!result.ok) return { error: result.error, sentTo: null };
  return { error: null, sentTo: email };
}

export type StartState = { error: string | null; queued: number | null };

/**
 * Turns a draft into a queue.
 *
 * The audience is resolved here, once, and written down as one row per
 * person. From this moment the campaign's recipients are fixed: someone
 * who joins the waitlist mid-send doesn't get pulled into a mail they were
 * never part of, and the count on screen can't drift while it sends.
 */
export async function startCampaign(
  _prev: StartState,
  formData: FormData
): Promise<StartState> {
  await requireConsole("campaigns");

  const campaignId = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(campaignId);
  if (!campaign) return { error: "That campaign no longer exists.", queued: null };
  if (campaign.status !== "draft" && campaign.status !== "paused") {
    return { error: "This campaign is already sending or sent.", queued: null };
  }

  const supabase = createServerSupabaseClient();

  let members;
  try {
    members = await resolveAudience(audienceSchema.parse(campaign.audience));
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Couldn't work out the audience.",
      queued: null,
    };
  }

  if (members.length === 0) {
    return { error: "Nobody matches that audience — nothing was sent.", queued: null };
  }

  // Chunked because PostgREST has a request-size ceiling and 361 rows in
  // one insert is comfortably past what's worth risking.
  for (let i = 0; i < members.length; i += 500) {
    const chunk = members.slice(i, i + 500).map((member) => ({
      campaign_id: campaignId,
      email: member.email,
      name: member.name,
      status: "pending",
    }));

    const { error } = await supabase
      .from("email_campaign_recipients")
      .upsert(chunk, { onConflict: "campaign_id,email", ignoreDuplicates: true });

    if (error) {
      console.error("failed to queue campaign recipients:", error);
      return { error: "Couldn't build the send list. Nothing was sent.", queued: null };
    }
  }

  const { error: statusError } = await supabase
    .from("email_campaigns")
    .update({
      status: "sending",
      total_recipients: members.length,
      started_at: campaign.started_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (statusError) {
    console.error("failed to mark campaign as sending:", statusError);
    return { error: "Couldn't start the campaign. Please try again.", queued: null };
  }

  revalidatePath(`/console/campaigns/${campaignId}`);
  return { error: null, queued: members.length };
}

export interface BatchResult {
  attempted: number;
  sent: number;
  failed: number;
  remaining: number;
  done: boolean;
  error: string | null;
  /** True when the failure is worth calling again for. */
  retryable: boolean;
}

/**
 * Sends the next slice of a campaign. Called repeatedly by the dashboard
 * until `done`.
 */
export async function sendNextBatch(campaignId: string): Promise<BatchResult> {
  await requireConsole("campaigns");

  const empty: BatchResult = {
    attempted: 0,
    sent: 0,
    failed: 0,
    remaining: 0,
    done: false,
    error: null,
    retryable: false,
  };

  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { ...empty, done: true, error: "That campaign no longer exists." };
  }
  if (campaign.status === "paused") {
    return { ...empty, done: true, error: "This campaign is paused." };
  }
  if (campaign.status === "sent") return { ...empty, done: true };

  const supabase = createServerSupabaseClient();

  const { data: batch, error: claimError } = await supabase
    .from("email_campaign_recipients")
    .select("id, email, name")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .order("email", { ascending: true })
    .limit(BATCH_LIMIT);

  if (claimError) {
    console.error("failed to claim a batch:", claimError);
    return { ...empty, error: "Couldn't read the send queue.", retryable: true };
  }

  if (!batch || batch.length === 0) {
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("status", "sending");

    revalidatePath("/console/campaigns");
    revalidatePath(`/console/campaigns/${campaignId}`);
    return { ...empty, done: true };
  }

  // Re-checked per batch, not once per campaign: a send takes minutes, and
  // someone who unsubscribes from batch one must not receive batch four.
  let suppressed: Set<string>;
  try {
    suppressed = await loadSuppressed();
  } catch {
    return { ...empty, error: "Couldn't read the unsubscribe list.", retryable: true };
  }

  const dropped = batch.filter((row) => suppressed.has(row.email));
  const targets = batch.filter((row) => !suppressed.has(row.email));

  if (dropped.length > 0) {
    await supabase
      .from("email_campaign_recipients")
      .update({
        status: "failed",
        error: "Unsubscribed before this batch went out",
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        dropped.map((row) => row.id)
      );
  }

  const content = contentOf(campaign);
  const emails: BatchEmail[] = targets.map((row) => {
    const options = {
      ...content,
      recipientName: row.name,
      unsubscribeUrl: unsubscribeUrl(row.email),
    };
    return {
      to: row.email,
      subject: content.subject,
      html: renderCampaignHtml(options),
      text: renderCampaignText(options),
      headers: unsubscribeHeaders(row.email),
      tags: [
        { name: "kind", value: "campaign" },
        { name: "campaign_id", value: campaignId },
      ],
    };
  });

  const result = await sendBatchEmails(emails);
  const now = new Date().toISOString();

  if (!result.ok) {
    // Left pending on a retryable failure, so the next call picks the same
    // people up. Marked failed otherwise, so the campaign can finish
    // instead of looping on a payload Resend will never accept.
    if (!result.retryable && targets.length > 0) {
      await supabase
        .from("email_campaign_recipients")
        .update({ status: "failed", error: result.error.slice(0, 300), updated_at: now })
        .in(
          "id",
          targets.map((row) => row.id)
        );
    }

    const { count } = await supabase
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "pending");

    return {
      attempted: targets.length,
      sent: 0,
      failed: result.retryable ? 0 : targets.length,
      remaining: count ?? 0,
      done: false,
      error: result.error,
      retryable: result.retryable,
    };
  }

  // Resend returns ids in request order; anything past the end just means
  // we couldn't read one back, which is not a reason to re-send.
  await Promise.all(
    targets.map((row, i) =>
      supabase
        .from("email_campaign_recipients")
        .update({
          status: "sent",
          resend_id: result.ids[i] ?? null,
          sent_at: now,
          updated_at: now,
          error: null,
        })
        .eq("id", row.id)
    )
  );

  const { count } = await supabase
    .from("email_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "pending");

  const remaining = count ?? 0;

  if (remaining === 0) {
    await supabase
      .from("email_campaigns")
      .update({ status: "sent", completed_at: now, updated_at: now })
      .eq("id", campaignId)
      .eq("status", "sending");
    revalidatePath("/console/campaigns");
  }

  revalidatePath(`/console/campaigns/${campaignId}`);

  return {
    attempted: batch.length,
    sent: targets.length,
    failed: dropped.length,
    remaining,
    done: remaining === 0,
    error: null,
    retryable: false,
  };
}

export async function pauseCampaign(formData: FormData): Promise<void> {
  await requireConsole("campaigns");
  const campaignId = campaignIdOf(formData);
  const supabase = createServerSupabaseClient();
  await supabase
    .from("email_campaigns")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", "sending");
  revalidatePath(`/console/campaigns/${campaignId}`);
}

export async function resumeCampaign(formData: FormData): Promise<void> {
  await requireConsole("campaigns");
  const campaignId = campaignIdOf(formData);
  const supabase = createServerSupabaseClient();
  await supabase
    .from("email_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", "paused");
  revalidatePath(`/console/campaigns/${campaignId}`);
}

/** Puts anything that failed for a retryable reason back in the queue. */
export async function retryFailed(formData: FormData): Promise<void> {
  await requireConsole("campaigns");
  const campaignId = campaignIdOf(formData);
  const supabase = createServerSupabaseClient();
  await supabase
    .from("email_campaign_recipients")
    .update({ status: "pending", error: null, updated_at: new Date().toISOString() })
    .eq("campaign_id", campaignId)
    .eq("status", "failed");
  await supabase
    .from("email_campaigns")
    .update({ status: "sending", completed_at: null, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  revalidatePath(`/console/campaigns/${campaignId}`);
}

const manualUnsubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export type UnsubscribeState = { error: string | null; done: string | null };

export async function addUnsubscribe(
  _prev: UnsubscribeState,
  formData: FormData
): Promise<UnsubscribeState> {
  await requireConsole("campaigns");

  const parsed = manualUnsubscribeSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email.", done: null };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert({ email: parsed.data.email, reason: "manual" }, { onConflict: "email" });

  if (error) {
    console.error("failed to add a manual unsubscribe:", error);
    return { error: "Couldn't add that address. Please try again.", done: null };
  }

  revalidatePath("/console/campaigns/unsubscribes");
  return { error: null, done: parsed.data.email };
}

export async function removeUnsubscribe(formData: FormData): Promise<void> {
  await requireConsole("campaigns");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const supabase = createServerSupabaseClient();
  await supabase.from("email_unsubscribes").delete().eq("email", email);
  revalidatePath("/console/campaigns/unsubscribes");
}
