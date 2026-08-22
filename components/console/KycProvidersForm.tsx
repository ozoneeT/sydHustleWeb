"use client";

import { useActionState, useState } from "react";

import { updateKycProviders, type KycState } from "@/lib/console/actions";
import {
  KYC_PROVIDERS,
  KYC_PROVIDER_LABELS,
  NIN_CHECKS_STATE,
  type KycProvider,
} from "@/lib/console/kyc-providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const initialState: KycState = { error: null, saved: false };

const RAILS = {
  nin: {
    field: "nin_provider",
    title: "NIN check",
    blurb:
      "The check at the door: is this a real person, and are they who they say they are. Gates in-person Hustles, applying, booking a Skill and every withdrawal.",
  },
  bvn: {
    field: "bvn_provider",
    title: "BVN check",
    blurb:
      "The second document, asked for only above the per-rung threshold or when support asks. Matched against the name on the NIN either way, so this switch changes cost and availability and nothing about who passes.",
  },
} as const;

function RailPicker({
  rail,
  value,
  onChange,
}: {
  rail: keyof typeof RAILS;
  value: KycProvider;
  onChange: (next: KycProvider) => void;
}) {
  const spec = RAILS[rail];

  return (
    <div className="space-y-3">
      <div>
        <Label>{spec.title}</Label>
        <p className="text-sm text-muted-foreground">{spec.blurb}</p>
      </div>

      <input name={spec.field} type="hidden" value={value} />

      <div className="flex flex-wrap gap-2">
        {KYC_PROVIDERS.map((provider) => {
          const active = provider === value;
          return (
            <button
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              key={provider}
              onClick={() => onChange(provider)}
              type="button"
            >
              {KYC_PROVIDER_LABELS[provider]}
            </button>
          );
        })}
      </div>

      {/* The one asymmetry between the rails, said where the decision is
          made rather than in a doc nobody opens mid-incident. */}
      {rail === "nin" && !NIN_CHECKS_STATE[value] ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          <strong>Three factors, not four.</strong>{" "}
          {KYC_PROVIDER_LABELS[value]}&apos;s NIN record carries no state of
          origin, so that factor cannot be checked on this rail — the proof
          becomes both names plus date of birth. Someone holding a stolen NIN,
          the name on it and the date of birth passes a check they would fail
          on a rail that returns a state. The app stops asking for a state
          while this is selected.
        </p>
      ) : null}
    </div>
  );
}

export function KycProvidersForm({
  nin,
  bvn,
}: {
  nin: KycProvider;
  bvn: KycProvider;
}) {
  const [state, formAction, pending] = useActionState(
    updateKycProviders,
    initialState
  );
  const [ninValue, setNin] = useState<KycProvider>(nin);
  const [bvnValue, setBvn] = useState<KycProvider>(bvn);

  return (
    <Card className="space-y-6 p-5">
      <form action={formAction} className="space-y-6">
        <RailPicker onChange={setNin} rail="nin" value={ninValue} />
        <div className="h-px bg-white/10" />
        <RailPicker onChange={setBvn} rail="bvn" value={bvnValue} />

        <div className="flex items-center gap-3">
          <Button disabled={pending} type="submit">
            {pending ? "Saving…" : "Save rails"}
          </Button>
          {state.error ? (
            <span className="text-sm text-red-400">{state.error}</span>
          ) : null}
          {state.saved ? (
            <span className="text-sm text-emerald-400">
              Saved. It applies to the next check — anything already verified
              stays verified.
            </span>
          ) : null}
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        A switch changes who answers the NEXT lookup. Records already
        verified are untouched, and the encrypted record we cached from
        whichever provider found it stays valid — a record is a record, so a
        retry after a switch is still free.
      </p>
    </Card>
  );
}
