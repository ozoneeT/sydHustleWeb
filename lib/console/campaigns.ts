import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EmailAudience } from "@/lib/email/audience";

export type CampaignStatus = "draft" | "sending" | "paused" | "sent" | "failed";

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  heading: string | null;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  footer_note: string | null;
  logo_size: number | null;
  banner_size: number | null;
  audience: EmailAudience;
  status: CampaignStatus;
  total_recipients: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const CAMPAIGN_COLUMNS = `
  id, name, subject, preheader, heading, body,
  cta_label, cta_url, image_url, footer_note,
  logo_size, banner_size,
  audience, status, total_recipients,
  created_at, updated_at, started_at, completed_at
`;

/**
 * Every state a recipient row can be in, in the order it can reach them.
 * `sent` means Resend accepted it; `delivered` and beyond only ever arrive
 * from the webhook, so a deployment with no webhook configured simply
 * stops at `sent` rather than showing wrong numbers.
 */
export interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
}

const EMPTY_STATS: CampaignStats = {
  total: 0,
  pending: 0,
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  bounced: 0,
  complained: 0,
  failed: 0,
};

export async function listCampaigns(): Promise<Campaign[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_campaigns")
    .select(CAMPAIGN_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to list campaigns:", error);
    return [];
  }
  return (data as unknown as Campaign[]) ?? [];
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("failed to load campaign:", error);
    return null;
  }
  return (data as unknown as Campaign) ?? null;
}

/**
 * Counted with head-only queries rather than by pulling every row: a
 * campaign has hundreds of recipients and this runs on every poll while a
 * send is in flight.
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const supabase = createServerSupabaseClient();

  const statuses = [
    "pending",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "complained",
    "failed",
  ] as const;

  const [totalResult, ...results] = await Promise.all([
    supabase
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId),
    ...statuses.map((status) =>
      supabase
        .from("email_campaign_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("status", status)
    ),
  ]);

  const stats: CampaignStats = { ...EMPTY_STATS, total: totalResult.count ?? 0 };
  statuses.forEach((status, i) => {
    stats[status] = results[i]?.count ?? 0;
  });
  return stats;
}

export interface RecipientRow {
  id: string;
  email: string;
  name: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
}

export async function listRecipients(
  campaignId: string,
  options: { status?: string; limit?: number } = {}
): Promise<RecipientRow[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("email_campaign_recipients")
    .select("id, email, name, status, error, sent_at")
    .eq("campaign_id", campaignId)
    .order("email", { ascending: true })
    .limit(options.limit ?? 200);

  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) {
    console.error("failed to list campaign recipients:", error);
    return [];
  }
  return (data as RecipientRow[]) ?? [];
}

export interface Unsubscribe {
  email: string;
  reason: string;
  created_at: string;
}

export async function listUnsubscribes(limit = 200): Promise<Unsubscribe[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .select("email, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("failed to list unsubscribes:", error);
    return [];
  }
  return (data as Unsubscribe[]) ?? [];
}

/** The three numbers the campaigns index leads with. */
export async function getEmailOverview(): Promise<{
  campaignsSent: number;
  emailsSent: number;
  unsubscribed: number;
}> {
  const supabase = createServerSupabaseClient();

  const [campaigns, emails, unsubs] = await Promise.all([
    supabase
      .from("email_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .in("status", ["sent", "delivered", "opened", "clicked"]),
    supabase.from("email_unsubscribes").select("email", { count: "exact", head: true }),
  ]);

  return {
    campaignsSent: campaigns.count ?? 0,
    emailsSent: emails.count ?? 0,
    unsubscribed: unsubs.count ?? 0,
  };
}
