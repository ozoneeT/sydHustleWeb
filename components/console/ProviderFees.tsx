import { Card } from "@/components/ui/card";
import { naira } from "@/lib/console/format";
import {
  PROVIDER_LABELS,
  type PaymentProvider,
} from "@/lib/console/payment-providers";
import {
  DEPOSIT_SAMPLES,
  MARGIN_SAMPLES,
  PROVIDER_FEES,
  depositCost,
  withdrawalMargin,
  type ProviderFees as Fees,
} from "@/lib/console/provider-fees";

/**
 * What each provider charges, and what that leaves.
 *
 * Both providers are shown rather than only the active one, because this
 * is the page where the provider is chosen and the cost difference is one
 * of the few things that should decide it.
 */

function FeeList({ rows }: { rows: Fees["payIn"] }) {
  return (
    <dl className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm">{row.label}</dt>
            <dd className="shrink-0 font-mono text-sm font-semibold">
              {row.fee}
            </dd>
          </div>
          {row.note ? (
            <p className="text-xs text-muted-foreground">{row.note}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

function ProviderCard({ fees, active }: { fees: Fees; active: boolean }) {
  return (
    <Card className={`p-5 ${active ? "border-accent/40" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">{fees.label}</p>
        {active ? (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            in use
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
        Money in
      </p>
      <div className="mt-2">
        <FeeList rows={fees.payIn} />
      </div>

      <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">
        Money out
      </p>
      <div className="mt-2">
        <FeeList rows={fees.payOut} />
      </div>

      <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
        {fees.caveats.map((caveat) => (
          <li key={caveat}>• {caveat}</li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Checked {fees.checkedOn} ·{" "}
        {fees.sources.map((source, index) => (
          <span key={source.url}>
            {index > 0 ? ", " : ""}
            <a
              className="underline"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              {source.label}
            </a>
          </span>
        ))}
      </p>
    </Card>
  );
}

export function ProviderFees({
  cutPercent,
  fundingProvider,
  payoutProvider,
}: {
  cutPercent: number;
  fundingProvider: PaymentProvider;
  payoutProvider: PaymentProvider;
}) {
  const margins = MARGIN_SAMPLES.map((amount) => ({
    amount,
    ...withdrawalMargin(amount, cutPercent),
  }));
  const firstLoss = margins.find((row) => row.net < 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What the providers charge
        </h2>
        <p className="text-sm text-muted-foreground">
          Published rates, not live data. Neither provider prices deposit
          channels differently, so there is no cheaper method to steer people
          towards — the choice that costs money is which provider takes
          deposits at all.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProviderCard
          active={fundingProvider === "paystack" || payoutProvider === "paystack"}
          fees={PROVIDER_FEES.paystack}
        />
        <ProviderCard
          active={fundingProvider === "opay" || payoutProvider === "opay"}
          fees={PROVIDER_FEES.opay}
        />
      </div>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          What a deposit costs you
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The user is credited the full amount either way, so this comes out
          of sydHustle. Below ₦2,500 the two are identical; above it,
          Paystack&apos;s flat ₦100 is the entire difference.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-white/10">
                <th className="py-2 text-left font-medium">Top-up</th>
                <th className="py-2 text-right font-medium">Paystack</th>
                <th className="py-2 text-right font-medium">OPay</th>
                <th className="py-2 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {DEPOSIT_SAMPLES.map((amount) => {
                const ps = depositCost(amount, "paystack");
                const op = depositCost(amount, "opay");
                return (
                  <tr className="border-b border-white/5" key={amount}>
                    <td className="py-2">{naira(amount)}</td>
                    <td className="py-2 text-right font-mono">{naira(ps)}</td>
                    <td className="py-2 text-right font-mono">{naira(op)}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground">
                      {ps === op ? "same" : `+${naira(ps - op)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          At any top-up of ₦2,500 or more, OPay costs ₦100 less per deposit.
          Whether that matters is a volume question: at a thousand deposits a
          month it is {naira(100000)} a year.
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          What a withdrawal leaves you, at your current {cutPercent}% cut
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Both providers charge the same three tiers, so this does not change
          with the switch. Your cut is a percentage and their charge is flat,
          so the two cross over somewhere — below that point a withdrawal
          costs more to send than it earns.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-white/10">
                <th className="py-2 text-left font-medium">Withdrawal</th>
                <th className="py-2 text-right font-medium">Your cut</th>
                <th className="py-2 text-right font-medium">Provider</th>
                <th className="py-2 text-right font-medium">You keep</th>
              </tr>
            </thead>
            <tbody>
              {margins.map((row) => (
                <tr className="border-b border-white/5" key={row.amount}>
                  <td className="py-2">{naira(row.amount)}</td>
                  <td className="py-2 text-right font-mono">
                    {naira(row.cut)}
                  </td>
                  <td className="py-2 text-right font-mono text-muted-foreground">
                    {naira(row.providerCost)}
                    {row.stampDuty > 0 ? (
                      <span className="ml-1 text-xs">(incl. duty)</span>
                    ) : null}
                  </td>
                  <td
                    className={`py-2 text-right font-mono font-semibold ${
                      row.net < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {row.net < 0 ? "−" : ""}
                    {naira(Math.abs(row.net))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {firstLoss ? (
          <p className="mt-3 text-sm text-amber-400">
            At {cutPercent}%, a {naira(firstLoss.amount)} withdrawal loses you{" "}
            {naira(Math.abs(firstLoss.net))} once the provider is paid. Either
            raise the cut, or raise the minimum withdrawal above that point.
          </p>
        ) : (
          <p className="mt-3 text-sm text-emerald-400">
            At {cutPercent}%, every withdrawal size above covers its own
            transfer cost.
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Note the jump between {naira(9999)} and {naira(10000)} — the ₦50
          stamp duty starts there, so a single naira costs you fifty. Neither
          provider absorbs it; {PROVIDER_LABELS.opay} does not mention it on
          their pricing page at all, and it is included above on the
          assumption that a statutory levy applies whoever moves the money.
        </p>
      </Card>
    </div>
  );
}
