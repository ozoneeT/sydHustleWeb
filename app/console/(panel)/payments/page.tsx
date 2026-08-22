import { KycProvidersForm } from "@/components/console/KycProvidersForm";
import { PaymentProvidersForm } from "@/components/console/PaymentProvidersForm";
import { ProviderFees } from "@/components/console/ProviderFees";
import { Card } from "@/components/ui/card";
import { getPlatformSettings } from "@/lib/console/data";
import { PROVIDER_LABELS } from "@/lib/console/payment-providers";
import { getPaymentRails } from "@/lib/console/payments";

export const metadata = { title: "Payments — sydHustle Console" };

// Read fresh on every request. This page takes no search params, so Next
// would otherwise prerender it at build time and serve a snapshot of
// which provider was live when the console was last deployed - the exact
// misreading the page exists to prevent. Credential readiness is live
// state too: secrets set in Supabase minutes ago have to show up here.
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [settings, rails] = await Promise.all([
    getPlatformSettings(),
    getPaymentRails(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Which provider takes money in, and which sends it out. The two are
          set separately, so one rail can go live while the other is still
          being tested.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Money in
          </p>
          <p className="mt-1 text-xl font-semibold">
            {PROVIDER_LABELS[settings.funding_provider]}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Money out
          </p>
          <p className="mt-1 text-xl font-semibold">
            {PROVIDER_LABELS[settings.payout_provider]}
          </p>
        </Card>
      </div>

      {rails === null ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          Could not reach the payment functions to check which credentials
          are set, so the readiness labels below are blank. The switch still
          works; you are just choosing without that confirmation.
        </Card>
      ) : null}

      <Card className="p-5">
        <PaymentProvidersForm
          funding={settings.funding_provider}
          payout={settings.payout_provider}
          rails={rails}
        />
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Identity checks</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Who answers the NIN and BVN lookups. Separate from the money
          rails and from each other: separate products, separate outages,
          separate prices. The match always runs on our side, so a switch
          moves cost and availability rather than the standard — with one
          exception, called out below where it applies.
        </p>
      </div>

      <KycProvidersForm bvn={settings.bvn_provider} nin={settings.nin_provider} />

      <ProviderFees
        cutPercent={settings.withdrawal_cut_percent}
        fundingProvider={settings.funding_provider}
        payoutProvider={settings.payout_provider}
      />

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          What a switch does, and what it deliberately does not
        </p>
        <p>
          It decides where the NEXT deposit and the NEXT withdrawal go.
          Every payment intent and every withdrawal row records the
          provider it started with, and the functions that settle them read
          that record rather than this setting, so money already moving
          finishes at the provider holding it. Both providers&apos; webhooks
          stay live at all times for the same reason.
        </p>
        <p>
          Changing the payout provider asks users to confirm their saved
          withdrawal banks once against the new one. That is not a formality:
          bank codes come from each provider&apos;s own list, and paying a
          code from the wrong list is how money reaches the wrong bank.
        </p>
        <p>
          Credentials are not set here. They live in the Supabase function
          secrets, and this page only reports whether they are present and
          whether they look like live or test keys.
        </p>
      </Card>
    </div>
  );
}
