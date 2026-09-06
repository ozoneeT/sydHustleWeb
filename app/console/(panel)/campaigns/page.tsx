import Link from "next/link";
import { Mail, MailX, Plus, Send } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEmailOverview, listCampaigns } from "@/lib/console/campaigns";
import { describeAudience } from "@/lib/email/audience";
import { shortDate } from "@/lib/console/format";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "Email campaigns — sydHustle Console" };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-white/10 text-muted-foreground",
  sending: "bg-amber-400/15 text-amber-300",
  paused: "bg-amber-400/15 text-amber-300",
  sent: "bg-accent/15 text-accent",
  failed: "bg-red-500/15 text-red-300",
};

export default async function CampaignsPage() {
  await requireConsole("campaigns");

  const [campaigns, overview] = await Promise.all([
    listCampaigns(),
    getEmailOverview(),
  ]);

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email campaigns</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Bulk email to the pre-launch list — survey respondents and waitlist
            signups. Every campaign uses the same template, carries a working
            unsubscribe link, and skips anyone who has opted out.
          </p>
        </div>
        <Button asChild>
          <Link href="/console/campaigns/new">
            <Plus className="h-4 w-4" />
            New campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Campaigns sent" value={overview.campaignsSent} />
        <StatCard label="Emails delivered to Resend" value={overview.emailsSent} />
        <StatCard
          label="Unsubscribed"
          value={overview.unsubscribed}
          hint="Excluded from every future send"
        />
      </div>

      <Card className="border-amber-500/30 p-4 text-sm text-muted-foreground">
        These people gave us their address on the survey or the waitlist, which
        is consent to hear about launch — not a licence to mail them anything.
        App users are deliberately not reachable from here: an account is not a
        marketing opt-in, and the app itself promises no promotional pushes.
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All campaigns
          </h2>
          <Link
            href="/console/campaigns/unsubscribes"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <MailX className="h-3.5 w-3.5" />
            Unsubscribe list
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm text-muted-foreground">
                Start from a template and send yourself a test first.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/console/campaigns/new">Write the first one</Link>
            </Button>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">People</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/campaigns/${campaign.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {campaign.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {campaign.subject}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {describeAudience(campaign.audience)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLE[campaign.status] ?? STATUS_STYLE.draft
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {campaign.total_recipients || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {shortDate(campaign.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-semibold">Where the addresses come from</p>
          <p className="text-sm text-muted-foreground">
            The same contacts as the survey list, minus anyone who unsubscribed.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/surveylist">
            <Send className="h-4 w-4" />
            Open the survey list
          </Link>
        </Button>
      </Card>
    </div>
  );
}
