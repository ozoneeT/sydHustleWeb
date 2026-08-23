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

/** Mirrors the seed in 20260820180000_tiered_release_fee.sql. Displayed
 * only - the database is the authority, and this is here so the page can
 * state the rates without a round trip. */
const RELEASE_TIERS = [
  { band: "Up to ₦5,000", rate: "10%" },
  { band: "₦5,001 – ₦20,000", rate: "8%" },
  { band: "₦20,001 – ₦50,000", rate: "6%" },
  { band: "₦50,001 – ₦100,000", rate: "5%" },
  { band: "Above ₦100,000", rate: "4%" },
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
      <div className="space-y-4 rounded-xl border border-white/10 p-4">
        <div>
          <h3 className="font-medium">Withdrawal fee</h3>
          <p className="text-xs text-muted-foreground">
            What a Hustler pays to take their own money out. Percentage and
            flat are ADDED together, then capped. Leave all three at zero
            for free withdrawals — free is a setting here, not a special
            case in the code, and the app says &ldquo;Free to your saved
            bank&rdquo; only while it is true.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="withdrawal_cut_percent">Percent (%)</Label>
            <Input
              defaultValue={settings.withdrawal_cut_percent}
              id="withdrawal_cut_percent"
              max={30}
              min={0}
              name="withdrawal_cut_percent"
              step="0.5"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal_fee_flat">Flat (₦)</Label>
            <Input
              defaultValue={settings.withdrawal_fee_flat}
              id="withdrawal_fee_flat"
              min={0}
              name="withdrawal_fee_flat"
              step="10"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal_fee_cap">Cap (₦)</Label>
            <Input
              defaultValue={settings.withdrawal_fee_cap ?? ""}
              id="withdrawal_fee_cap"
              min={0}
              name="withdrawal_fee_cap"
              placeholder="no cap"
              step="10"
              type="number"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong className="text-amber-300">
            Currently advertised as free.
          </strong>{" "}
          sydHustle earns on released work, and free withdrawals are stated
          to users in the app — putting a rate back here charges people for
          something they were told was free, so it is worth telling them
          first. A flat fee is the honest shape if you do: a payout costs us
          per transfer, not per naira. Applies to new withdrawals only;
          in-flight ones keep the fee snapshotted on their own row, and
          stamp duty is separate and always passed through at cost.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 p-4">
        <div>
          <h3 className="font-medium">Add-money fee</h3>
          <p className="text-xs text-muted-foreground">
            sydHustle&apos;s cut of a deposit, charged{" "}
            <strong className="text-foreground">on top</strong> of whatever
            Paystack or Payvessel already takes from the payer. At zero the
            payer bears only the provider&apos;s cut, which never reaches
            our account and is not ours to book. Above zero they bear that
            plus this, and this is booked as revenue.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="deposit_fee_percent">Percent (%)</Label>
            <Input
              defaultValue={settings.deposit_fee_percent}
              id="deposit_fee_percent"
              max={30}
              min={0}
              name="deposit_fee_percent"
              step="0.5"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit_fee_flat">Flat (₦)</Label>
            <Input
              defaultValue={settings.deposit_fee_flat}
              id="deposit_fee_flat"
              min={0}
              name="deposit_fee_flat"
              step="10"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit_fee_cap">Cap (₦)</Label>
            <Input
              defaultValue={settings.deposit_fee_cap ?? ""}
              id="deposit_fee_cap"
              min={0}
              name="deposit_fee_cap"
              placeholder="no cap"
              step="10"
              type="number"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The deposit lands and the fee comes off it, so the ledger records
          all three figures — what arrived, what we took, what was credited.
          The AML review threshold is measured against{" "}
          <strong className="text-foreground">what arrived</strong>, so a
          fee cannot quietly move it.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 p-4">
        <div>
          <h3 className="font-medium">Store commission</h3>
          <p className="text-xs text-muted-foreground">
            What Apple and Google keep of an in-app purchase — hustleBoost
            and SMS alerts, which bill through the stores and never through
            the wallet. Used to estimate a cost line against that revenue,
            which is otherwise booked gross and reads as more than it is.
            30% is standard; 15% applies under the Small Business Program
            and to subscriptions after their first year.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="apple_commission_percent">Apple (%)</Label>
            <Input
              defaultValue={settings.apple_commission_percent}
              id="apple_commission_percent"
              max={50}
              min={0}
              name="apple_commission_percent"
              step="1"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_commission_percent">Google (%)</Label>
            <Input
              defaultValue={settings.google_commission_percent}
              id="google_commission_percent"
              max={50}
              min={0}
              name="google_commission_percent"
              step="1"
              type="number"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Always shown as an estimate and never promoted to exact: the
          store charges in the user&apos;s currency at their own price
          point and remits after their own FX. Changing a rate here affects
          purchases recorded from now on, not ones already booked.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Release fee tiers</Label>
        <div className="rounded-lg border border-white/10 text-xs">
          {RELEASE_TIERS.map((tier) => (
            <div
              className="flex justify-between border-b border-white/5 px-3 py-2 last:border-0"
              key={tier.band}
            >
              <span className="text-muted-foreground">{tier.band}</span>
              <span className="font-mono">{tier.rate}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          What sydHustle takes when a Hustle is released — the main revenue
          stream. Shown here rather than edited: the rates live in
          <code className="mx-1">platform_fee_tiers</code>, the app quotes
          them to Hustlers before they accept a price, and changing one is a
          pricing decision worth making deliberately in SQL until this form
          grows an editor for it.
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
