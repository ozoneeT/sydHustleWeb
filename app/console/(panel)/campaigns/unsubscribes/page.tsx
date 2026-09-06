import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { UnsubscribeList } from "@/components/console/UnsubscribeList";
import { listUnsubscribes } from "@/lib/console/campaigns";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "Unsubscribes — sydHustle Console" };

export default async function UnsubscribesPage() {
  await requireConsole("campaigns");

  const rows = await listUnsubscribes();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/console/campaigns"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Campaigns
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Unsubscribe list</h1>
        <p className="text-sm text-muted-foreground">
          Everyone excluded from every campaign, and why. Checked when an
          audience is built and again for every batch as it goes out.
        </p>
      </div>

      <Card className="border-amber-500/30 p-4 text-sm text-muted-foreground">
        Removing an address here starts mailing that person again. Only do it
        when they have asked you to — an address that bounced permanently or
        reported us as spam belongs on this list, and mailing it again damages
        every other email we send.
      </Card>

      <UnsubscribeList rows={rows} />
    </div>
  );
}
