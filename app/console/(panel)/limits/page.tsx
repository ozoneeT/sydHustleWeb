import { MoneyLimitsForm } from "@/components/console/MoneyLimitsForm";
import { Card } from "@/components/ui/card";
import {
  getAmlSettings,
  getBvnCounts,
  listMoneyTierLimits,
} from "@/lib/console/limits";

export const metadata = { title: "Limits — sydHustle Console" };

/** Live operational state, never a snapshot of the last deploy. */
export const dynamic = "force-dynamic";

export default async function LimitsPage() {
  const [limits, settings, counts] = await Promise.all([
    listMoneyTierLimits(),
    getAmlSettings(),
    getBvnCounts(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Money limits</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          What a rung is allowed to move. Withdrawal limits come off the
          Hustler ladder — what someone has earned here decides how fast
          money may leave — and deposit thresholds off the Provider ladder.
          A rung is slow to reach and cannot be bought, which makes it a
          better proxy for &ldquo;we know who this is&rdquo; than any single
          document.
        </p>
      </div>

      <MoneyLimitsForm
        bvnRequiredForAll={settings.bvn_required_for_all}
        limits={limits}
        openRequests={counts.openRequests}
        verifiedBvns={counts.verified}
      />

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          What changing a figure does, and what it deliberately does not
        </p>
        <p>
          It applies to the NEXT withdrawal and the NEXT deposit. Money
          already held for review keeps the threshold it broke, recorded on
          its own row, so lowering a limit does not retroactively justify a
          hold and raising one does not quietly release it.
        </p>
        <p>
          Nothing here is compiled into the app. The phone reads these
          figures from the database every time it draws the withdraw screen,
          so a change is live the moment it is saved.
        </p>
      </Card>
    </div>
  );
}
