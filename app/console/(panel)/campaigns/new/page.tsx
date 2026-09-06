import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CampaignComposer } from "@/components/console/CampaignComposer";
import { CAMPAIGN_PRESETS } from "@/lib/email/template";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "New campaign — sydHustle Console" };

/** The pre-launch invite is the one we'll send most, so it's what a blank
 * page opens on. Every field stays editable. */
const OPENING = CAMPAIGN_PRESETS[0].content;

export default async function NewCampaignPage() {
  await requireConsole("campaigns");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/console/campaigns"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Campaigns
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        <p className="text-sm text-muted-foreground">
          Write it, preview it, send yourself a test. Nothing goes out until you
          save the draft and press send on the next screen.
        </p>
      </div>

      <CampaignComposer
        campaignId={null}
        defaults={{
          name: OPENING.name,
          subject: OPENING.subject,
          preheader: OPENING.preheader ?? "",
          heading: OPENING.heading ?? "",
          body: OPENING.body,
          ctaLabel: OPENING.ctaLabel ?? "",
          ctaUrl: OPENING.ctaUrl ?? "",
          imageUrl: OPENING.imageUrl ?? "",
          footerNote: OPENING.footerNote ?? "",
          audience: { source: "all", school: "" },
        }}
      />
    </div>
  );
}
