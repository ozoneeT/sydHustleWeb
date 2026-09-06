import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";

import { CampaignComposer } from "@/components/console/CampaignComposer";
import { CampaignSender } from "@/components/console/CampaignSender";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deleteCampaign,
  retryFailed,
} from "@/lib/console/campaign-actions";
import {
  getCampaign,
  getCampaignStats,
  listRecipients,
} from "@/lib/console/campaigns";
import { describeAudience, previewAudience } from "@/lib/email/audience";
import { shortDate } from "@/lib/console/format";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "Campaign — sydHustle Console" };

const RECIPIENT_STYLE: Record<string, string> = {
  pending: "text-muted-foreground",
  sent: "text-foreground",
  delivered: "text-accent",
  opened: "text-accent",
  clicked: "text-accent",
  bounced: "text-amber-300",
  complained: "text-amber-300",
  failed: "text-red-300",
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  await requireConsole("campaigns");

  const { campaignId } = await params;
  const campaign = await getCampaign(campaignId);
  if (!campaign) notFound();

  const isDraft = campaign.status === "draft";

  const [stats, recipients, audiencePreview] = await Promise.all([
    getCampaignStats(campaignId),
    isDraft ? Promise.resolve([]) : listRecipients(campaignId, { limit: 100 }),
    isDraft
      ? previewAudience(campaign.audience).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Before a send there is no recipient table yet, so the count comes from
  // resolving the audience live; afterwards it comes from the rows that
  // were actually written, which is the number that really went out.
  const recipientCount = isDraft
    ? audiencePreview?.count ?? 0
    : campaign.total_recipients;

  const reached = stats.sent + stats.delivered + stats.opened + stats.clicked;
  const engaged = stats.opened + stats.clicked;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/console/campaigns"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Campaigns
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {describeAudience(campaign.audience)} ·{" "}
            {campaign.started_at
              ? `started ${shortDate(campaign.started_at)}`
              : `saved ${shortDate(campaign.updated_at)}`}
          </p>
        </div>

        {isDraft && (
          <form action={deleteCampaign}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <Button type="submit" variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete draft
            </Button>
          </form>
        )}
      </div>

      <CampaignSender
        campaignId={campaign.id}
        audienceLabel={describeAudience(campaign.audience)}
        recipientCount={recipientCount}
        status={campaign.status}
        pending={stats.pending}
        sent={reached}
      />

      {!isDraft && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Sent"
              value={reached}
              hint={`of ${campaign.total_recipients.toLocaleString()} queued`}
            />
            <StatCard
              label="Delivered"
              value={stats.delivered + stats.opened + stats.clicked}
              hint="Confirmed by the receiving server"
            />
            <StatCard
              label="Opened"
              value={engaged}
              hint={reached ? `${Math.round((engaged / reached) * 100)}% of sent` : undefined}
            />
            <StatCard
              label="Bounced or complained"
              value={stats.bounced + stats.complained}
              hint="Auto-added to the unsubscribe list"
            />
          </div>

          {stats.failed > 0 && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-amber-500/30 p-5">
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  {stats.failed.toLocaleString()} didn&apos;t go out
                </p>
                <p className="text-sm text-muted-foreground">
                  Retrying puts them back in the queue. Anyone who unsubscribed
                  mid-send stays excluded.
                </p>
              </div>
              <form action={retryFailed}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <Button type="submit" variant="secondary" size="sm">
                  <RotateCcw className="h-4 w-4" />
                  Retry failed
                </Button>
              </form>
            </Card>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recipients
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.name ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-3 capitalize ${
                          RECIPIENT_STYLE[row.status] ?? ""
                        }`}
                      >
                        {row.status}
                        {row.error && (
                          <span className="block text-xs text-muted-foreground">
                            {row.error}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {row.sent_at ? shortDate(row.sent_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {campaign.total_recipients > recipients.length && (
              <p className="text-xs text-muted-foreground">
                Showing the first {recipients.length.toLocaleString()} of{" "}
                {campaign.total_recipients.toLocaleString()}.
              </p>
            )}
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isDraft ? "The email" : "What was sent"}
        </h2>
        <CampaignComposer
          campaignId={campaign.id}
          readOnly={!isDraft}
          defaults={{
            name: campaign.name,
            subject: campaign.subject,
            preheader: campaign.preheader ?? "",
            heading: campaign.heading ?? "",
            body: campaign.body,
            ctaLabel: campaign.cta_label ?? "",
            ctaUrl: campaign.cta_url ?? "",
            imageUrl: campaign.image_url ?? "",
            footerNote: campaign.footer_note ?? "",
            audience: campaign.audience,
          }}
        />
      </section>
    </div>
  );
}
