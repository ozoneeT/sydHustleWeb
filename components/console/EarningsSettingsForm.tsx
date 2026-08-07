"use client";

import { useActionState } from "react";

import {
  updateEarningsSettings,
  type EarningsState,
} from "@/lib/console/actions";
import type { PlatformSettings } from "@/lib/console/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: EarningsState = { error: null, saved: false };

const APPLIES_OPTIONS = [
  { value: "provider", label: "Provider only (whoever locked the money)" },
  { value: "hustler", label: "Hustler only (from their wallet)" },
  { value: "both", label: "Both parties" },
  { value: "none", label: "No one — escrow cut off" },
];

export function EarningsSettingsForm({
  settings,
}: {
  settings: PlatformSettings;
}) {
  const [state, formAction, pending] = useActionState(
    updateEarningsSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="withdrawal_cut_percent">Withdrawal cut (%)</Label>
        <Input
          defaultValue={settings.withdrawal_cut_percent}
          id="withdrawal_cut_percent"
          max={30}
          min={0}
          name="withdrawal_cut_percent"
          step="0.5"
          type="number"
        />
        <p className="text-xs text-muted-foreground">
          Taken from every withdrawal; the transfer goes out net of this.
          Users see the exact net amount before they confirm. Applies to new
          withdrawals only — in-flight ones keep the rate they were created
          with.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="escrow_cut_percent">Escrow service cut (%)</Label>
        <Input
          defaultValue={settings.escrow_cut_percent}
          id="escrow_cut_percent"
          max={30}
          min={0}
          name="escrow_cut_percent"
          step="0.5"
          type="number"
        />
        <p className="text-xs text-muted-foreground">
          Charged only when a locked payment is refunded at the end of a
          dispute (service declined or appealed). Ordinary cancellations
          refund in full.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Escrow cut applies to</Label>
        <div className="space-y-2">
          {APPLIES_OPTIONS.map((option) => (
            <label
              className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-2.5 text-sm"
              key={option.value}
            >
              <input
                defaultChecked={settings.escrow_cut_applies_to === option.value}
                name="escrow_cut_applies_to"
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          The hustler&apos;s share is taken from their wallet and skipped if
          the balance can&apos;t cover it — a fee can never block the refund
          itself.
        </p>
      </div>

      <div className="space-y-2">
        <Label>SMS booking alerts — subscription prices (₦)</Label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { name: "sms_daily_price", label: "Daily", value: settings.sms_daily_price },
              { name: "sms_weekly_price", label: "Weekly", value: settings.sms_weekly_price },
              { name: "sms_monthly_price", label: "Monthly", value: settings.sms_monthly_price },
            ] as const
          ).map((field) => (
            <div key={field.name}>
              <p className="mb-1 text-xs text-muted-foreground">{field.label}</p>
              <Input
                defaultValue={field.value}
                max={10000}
                min={0}
                name={field.name}
                step="1"
                type="number"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          What a Hustler pays for offline booking texts. New prices apply
          from each subscriber&apos;s next renewal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sms_number_change_fee">
          SMS alerts — number change fee (₦)
        </Label>
        <Input
          defaultValue={settings.sms_number_change_fee}
          id="sms_number_change_fee"
          max={10000}
          min={0}
          name="sms_number_change_fee"
          step="1"
          type="number"
        />
        <p className="text-xs text-muted-foreground">
          Charged once when a subscriber moves their alerts to a different
          number — it covers re-verifying the new handset by text. It buys
          the change, not the attempt: someone who pays and then backs out
          keeps the credit and changes later for free. Repricing only
          affects slots bought from now on.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.saved && !state.error ? (
        <p className="text-sm text-emerald-400">
          Saved — new transactions use these rates immediately.
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save rates"}
      </Button>
    </form>
  );
}
