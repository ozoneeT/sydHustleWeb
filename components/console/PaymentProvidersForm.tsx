"use client";

import { useActionState, useState } from "react";

import {
  updatePaymentProviders,
  type ProvidersState,
} from "@/lib/console/actions";
import {
  PROVIDER_LABELS,
  type PaymentProvider,
  type PaymentRails,
  type RailReadiness,
} from "@/lib/console/payments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const initialState: ProvidersState = { error: null, saved: false };

const PROVIDERS: PaymentProvider[] = ["paystack", "opay"];

const RAILS = {
  funding: {
    field: "funding_provider",
    title: "Add money",
    blurb:
      "Handles every way a wallet is topped up: card, bank transfer, USSD, and the OPay app hand-off where OPay is the one taking it.",
  },
  payout: {
    field: "payout_provider",
    title: "Payouts",
    blurb:
      "Handles every withdrawal, and with it the bank list and the account verification behind saved withdrawal banks.",
  },
} as const;

/** What the credentials say, in one line. Deliberately not a verdict on
 * whether the provider works: only a real call proves that. */
function Readiness({ readiness }: { readiness: RailReadiness | undefined }) {
  if (!readiness) {
    return (
      <span className="text-xs text-muted-foreground">
        Credentials unknown
      </span>
    );
  }
  if (!readiness.configured) {
    return (
      <span className="text-xs font-medium text-red-400">
        No credentials
        {readiness.missing.length > 0
          ? ` (${readiness.missing.join(", ")})`
          : ""}
      </span>
    );
  }
  return readiness.live ? (
    <span className="text-xs font-medium text-emerald-400">Live keys</span>
  ) : (
    <span className="text-xs font-medium text-amber-400">Test keys</span>
  );
}

function RailPicker({
  rail,
  value,
  onChange,
  readiness,
}: {
  rail: keyof typeof RAILS;
  value: PaymentProvider;
  onChange: (next: PaymentProvider) => void;
  readiness: Record<PaymentProvider, RailReadiness> | undefined;
}) {
  const spec = RAILS[rail];
  const chosen = readiness?.[value];

  return (
    <div className="space-y-3">
      <div>
        <Label>{spec.title}</Label>
        <p className="text-xs text-muted-foreground">{spec.blurb}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              value === provider
                ? "border-accent bg-accent/10"
                : "border-white/10"
            }`}
            key={provider}
          >
            <input
              checked={value === provider}
              className="sr-only"
              name={spec.field}
              onChange={() => onChange(provider)}
              type="radio"
              value={provider}
            />
            <span className="flex-1">
              <span className="block font-medium">
                {PROVIDER_LABELS[provider]}
              </span>
              <Readiness readiness={readiness?.[provider]} />
            </span>
            <span
              aria-hidden
              className={`h-3.5 w-3.5 rounded-full border ${
                value === provider
                  ? "border-accent bg-accent"
                  : "border-white/30"
              }`}
            />
          </label>
        ))}
      </div>

      {/* The warning that earns this screen its keep. A rail whose keys
          were never set fails every payment on it, and nothing else here
          would tell you before a user found out. */}
      {chosen && !chosen.configured ? (
        <p className="text-sm text-red-400">
          {PROVIDER_LABELS[value]} has no credentials for this rail
          {chosen.missing.length > 0
            ? `. Set ${chosen.missing.join(" and ")} in the Supabase function secrets first`
            : ""}
          . Every payment on it will fail until they are set.
        </p>
      ) : null}
      {chosen?.configured && chosen.live === false ? (
        <p className="text-sm text-amber-400">
          {PROVIDER_LABELS[value]} is on test credentials. Real money will
          not move on this rail.
        </p>
      ) : null}
    </div>
  );
}

/**
 * The provider switch, one rail at a time.
 *
 * Both rails are shown together because the interesting states are the
 * mixed ones - taking money in through the provider that is already live
 * while payouts stay on the one still being tested is exactly what this
 * exists for.
 */
export function PaymentProvidersForm({
  funding,
  payout,
  rails,
}: {
  funding: PaymentProvider;
  payout: PaymentProvider;
  rails: PaymentRails | null;
}) {
  const [state, formAction, pending] = useActionState(
    updatePaymentProviders,
    initialState
  );
  // Held in state so the warnings under each rail react to the choice
  // being considered, not only to the one already saved.
  const [fundingChoice, setFundingChoice] = useState<PaymentProvider>(funding);
  const [payoutChoice, setPayoutChoice] = useState<PaymentProvider>(payout);

  const changed = fundingChoice !== funding || payoutChoice !== payout;
  const payoutMoved = payoutChoice !== payout;

  return (
    <form action={formAction} className="space-y-8">
      <RailPicker
        onChange={setFundingChoice}
        rail="funding"
        readiness={rails?.funding}
        value={fundingChoice}
      />

      <RailPicker
        onChange={setPayoutChoice}
        rail="payout"
        readiness={rails?.payout}
        value={payoutChoice}
      />

      {payoutMoved ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <p className="font-medium">Saved withdrawal banks will need confirming</p>
          <p className="mt-1 text-amber-200/80">
            A bank code belongs to one provider&apos;s list, and Paystack
            needs a transfer recipient that OPay never mints. So every bank
            saved against {PROVIDER_LABELS[payout]} asks its owner to
            confirm it once against {PROVIDER_LABELS[payoutChoice]} before
            it can be paid, and automatic withdrawals to it are skipped
            with a notification in the meantime. Nothing already in flight
            is affected.
          </p>
        </Card>
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.saved && !state.error ? (
        <p className="text-sm text-emerald-400">
          Saved. New deposits and withdrawals use these providers from now
          on; anything already moving finishes where it started.
        </p>
      ) : null}

      <Button disabled={pending || !changed} type="submit">
        {pending ? "Saving…" : "Save providers"}
      </Button>
    </form>
  );
}
