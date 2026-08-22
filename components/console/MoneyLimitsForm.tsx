"use client";

import { useActionState } from "react";

import {
  updateBvnMode,
  updateMoneyLimits,
  type BvnModeState,
  type LimitsState,
} from "@/lib/console/limit-actions";
import type { MoneyTierLimit } from "@/lib/console/limits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const limitsInitial: LimitsState = { error: null, saved: false };
const modeInitial: BvnModeState = { error: null, saved: false };

function AmountCell({
  name,
  value,
}: {
  name: string;
  value: number | null;
}) {
  return (
    <Input
      className="h-9 w-32 font-mono text-sm"
      defaultValue={value ?? 0}
      min={0}
      name={name}
      step="1000"
      type="number"
    />
  );
}

export function MoneyLimitsForm({
  limits,
  bvnRequiredForAll,
  verifiedBvns,
  openRequests,
}: {
  limits: MoneyTierLimit[];
  bvnRequiredForAll: boolean;
  verifiedBvns: number;
  openRequests: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateMoneyLimits,
    limitsInitial
  );
  const [modeState, modeAction, modePending] = useActionState(
    updateBvnMode,
    modeInitial
  );

  const hustler = limits.filter((row) => row.track === "hustler");
  const provider = limits.filter((row) => row.track === "provider");

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-8">
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Withdrawals</h2>
            <p className="text-sm text-muted-foreground">
              How much a Hustler rung may take out in one day. The day is a
              Lagos day — the allowance comes back at midnight, not at 1am.
              Pending and processing withdrawals count against it, so a
              limit cannot be beaten three times over while the first
              transfer is still in the air.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Rung</th>
                  <th className="py-2">Per day</th>
                  <th className="py-2">BVN needed above</th>
                </tr>
              </thead>
              <tbody>
                {hustler.map((row) => (
                  <tr className="border-b border-white/5" key={row.tier_id}>
                    <td className="py-2 pr-4">{row.label}</td>
                    <td className="py-2 pr-4">
                      <AmountCell
                        name={`hustler.${row.rung}.daily_withdrawal_max`}
                        value={row.daily_withdrawal_max}
                      />
                    </td>
                    <td className="py-2">
                      <AmountCell
                        name={`hustler.${row.rung}.bvn_above`}
                        value={row.bvn_above}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            A single withdrawal is capped at ₦500,000 by the database
            whatever these say — raising a rung above that raises the daily
            total, not the size of one transfer.
          </p>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Adding money</h2>
            <p className="text-sm text-muted-foreground">
              A single deposit above the Provider rung&apos;s figure lands in
              the wallet and is held: it cannot be withdrawn, cannot pay for
              a Hustle, cannot be moved at all until someone here clears it
              or the user asks for it back. The rest of their balance is
              untouched.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Rung</th>
                  <th className="py-2">Flag a deposit above</th>
                </tr>
              </thead>
              <tbody>
                {provider.map((row) => (
                  <tr className="border-b border-white/5" key={row.tier_id}>
                    <td className="py-2 pr-4">{row.label}</td>
                    <td className="py-2">
                      <AmountCell
                        name={`provider.${row.rung}.deposit_flag_above`}
                        value={row.deposit_flag_above}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button disabled={pending} type="submit">
            {pending ? "Saving…" : "Save limits"}
          </Button>
          {state.error ? (
            <span className="text-sm text-red-400">{state.error}</span>
          ) : null}
          {state.saved ? (
            <span className="text-sm text-emerald-400">
              Saved. It applies to the next withdrawal and the next deposit.
            </span>
          ) : null}
        </div>
      </form>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">BVN mode</h2>
          <p className="text-sm text-muted-foreground">
            Off, a BVN is only asked for above the per-rung figure in the
            table, or from one person at a time from their Identity record.
            On, <strong className="text-foreground">every</strong> withdrawal
            by anyone without a verified BVN stops until they verify.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {verifiedBvns.toLocaleString()} accounts have a BVN on file ·{" "}
            {openRequests.toLocaleString()} being asked right now.
          </p>
        </div>

        <form action={modeAction} className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              className="size-4"
              defaultChecked={bvnRequiredForAll}
              name="bvn_required_for_all"
              type="checkbox"
            />
            <Label className="cursor-pointer">
              Require a verified BVN for every withdrawal
            </Label>
          </label>
          <Button disabled={modePending} type="submit" variant="secondary">
            {modePending ? "Saving…" : "Apply"}
          </Button>
          {modeState.error ? (
            <span className="text-sm text-red-400">{modeState.error}</span>
          ) : null}
          {modeState.saved ? (
            <span className="text-sm text-emerald-400">Applied.</span>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
