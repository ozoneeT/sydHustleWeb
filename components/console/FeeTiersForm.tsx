"use client";

import { useActionState, useId, useState } from "react";

import {
  updateFeeTiers,
  type FeeTiersState,
} from "@/lib/console/fee-tier-actions";
import type { FeeTier } from "@/lib/console/fee-tiers";
import { naira } from "@/lib/console/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: FeeTiersState = { error: null, saved: false };

type Row = {
  /** Stable across edits so React keeps the input focused while a floor
   * is being typed. Rows reorder themselves by amount only on save, and
   * an index key would move focus out from under the cursor. */
  key: string;
  above_amount: string;
  percent: string;
};

let nextKey = 0;
const makeKey = () => `rung-${(nextKey += 1)}`;

function toRows(tiers: FeeTier[]): Row[] {
  const sorted = [...tiers].sort((a, b) => a.above_amount - b.above_amount);
  const base = sorted.some((tier) => tier.above_amount === 0)
    ? sorted
    : [{ above_amount: 0, percent: 0 }, ...sorted];
  return base.map((tier) => ({
    key: makeKey(),
    above_amount: String(tier.above_amount),
    percent: String(tier.percent),
  }));
}

/**
 * The band a rung covers, worked out live as it is typed.
 *
 * Worth the code: `above_amount` is the floor a rate sits ABOVE,
 * exclusive, which is the correct way to store it and a genuinely
 * confusing thing to type into a box. Nobody should have to hold "5000
 * means ₦5,001 and up" in their head while setting a price, so the row
 * says what it means beside the number.
 */
function bandLabel(floors: number[], floor: number): string {
  const sorted = [...floors].sort((a, b) => a - b);
  const index = sorted.indexOf(floor);
  const ceiling = index >= 0 ? (sorted[index + 1] ?? null) : null;
  if (floor === 0 && ceiling === null) return "Any amount";
  if (floor === 0) return `Up to ${naira(ceiling!)}`;
  if (ceiling === null) return `Above ${naira(floor)}`;
  return `${naira(floor + 1)} – ${naira(ceiling)}`;
}

/**
 * The release fee rate card, editable.
 *
 * This used to be a hardcoded copy of the migration's seed with a note
 * underneath explaining that the real rates lived in SQL. That was
 * honest about the situation and wrong about the situation being
 * acceptable: this is the platform's main revenue line, it is the one
 * charge quoted to a user before they agree a price, and a displayed
 * copy of it was free to drift from the table the moment anybody ran an
 * UPDATE.
 *
 * The whole card posts at once. See lib/console/fee-tier-actions.ts for
 * why, and for the one rule this refuses to save: rates may not climb as
 * the amount does.
 */
export function FeeTiersForm({ tiers }: { tiers: FeeTier[] }) {
  const [state, formAction, pending] = useActionState(
    updateFeeTiers,
    initialState
  );
  const [rows, setRows] = useState<Row[]>(() => toRows(tiers));
  const headingId = useId();

  const floors = rows.map((row) => Number(row.above_amount) || 0);

  const patch = (key: string, field: keyof Omit<Row, "key">, value: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );

  const addRung = () =>
    setRows((current) => {
      const highest = Math.max(...current.map((row) => Number(row.above_amount) || 0));
      const lowestRate = current.reduce(
        (min, row) => Math.min(min, Number(row.percent) || 0),
        Number.POSITIVE_INFINITY
      );
      return [
        ...current,
        {
          key: makeKey(),
          above_amount: String(highest > 0 ? highest * 2 : 5000),
          // Starts at the lowest rate already on the card rather than at
          // zero: a new rung is almost always a cheaper band on the end,
          // and starting it at 0% would be a card the save then refuses.
          percent: String(Number.isFinite(lowestRate) ? lowestRate : 0),
        },
      ];
    });

  const removeRung = (key: string) =>
    setRows((current) => current.filter((row) => row.key !== key));

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-white/10 p-4">
      <div>
        <h3 className="font-medium" id={headingId}>
          Release fee tiers
        </h3>
        <p className="text-xs text-muted-foreground">
          What sydHustle takes when a Hustle is released — the main
          revenue stream, and the only fee a Hustler pays. The{" "}
          <strong className="text-foreground">whole</strong> Hustle is
          charged at the rate its size falls into, not marginally, so a
          ₦30,000 Hustle at 6% is a ₦1,800 fee and not a blend.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Applies above (₦)</th>
              <th className="py-2">Which means</th>
              <th className="py-2">Rate (%)</th>
              <th className="py-2 sr-only">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isBase = index === 0;
              return (
                <tr className="border-b border-white/5" key={row.key}>
                  <td className="py-2 pr-4">
                    {isBase ? (
                      <>
                        {/* The base rung is fixed at ₦0 and cannot be
                            removed. Without it every Hustle below the
                            lowest floor is charged nothing, and the gap
                            is invisible on the card - so it is a hidden
                            field rather than a rule to trip over. */}
                        <input name="above_amount" type="hidden" value="0" />
                        <span className="font-mono text-muted-foreground">₦0</span>
                      </>
                    ) : (
                      <Input
                        aria-label="Applies above"
                        className="h-9 w-36 font-mono text-sm"
                        min={0}
                        name="above_amount"
                        onChange={(event) =>
                          patch(row.key, "above_amount", event.target.value)
                        }
                        step="500"
                        type="number"
                        value={row.above_amount}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {bandLabel(floors, Number(row.above_amount) || 0)}
                  </td>
                  <td className="py-2 pr-4">
                    <Input
                      aria-label="Rate"
                      className="h-9 w-24 font-mono text-sm"
                      max={30}
                      min={0}
                      name="percent"
                      onChange={(event) =>
                        patch(row.key, "percent", event.target.value)
                      }
                      step="0.5"
                      type="number"
                      value={row.percent}
                    />
                  </td>
                  <td className="py-2 text-right">
                    {isBase ? null : (
                      <button
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-red-300"
                        onClick={() => removeRung(row.key)}
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button onClick={addRung} type="button" variant="secondary">
        Add a rung
      </Button>

      <p className="text-xs text-muted-foreground">
        Rates have to fall, or stay level, as the amount climbs. A rate
        that goes up at a boundary pays a bigger Hustle less than a
        smaller one — ₦5,000 at 4% takes home ₦4,800 while ₦5,001 at 10%
        takes home ₦4,500.90 — so the save refuses it rather than
        shipping the trap.
      </p>

      <p className="text-xs text-amber-400">
        A change applies to every Hustle released from the moment you save
        it, including work already agreed at a price quoted under the old
        card. The app tells a Hustler what they will receive before they
        accept, and this is the one setting that can make that sentence
        wrong afterwards — so move rates when little is mid-flight, and
        prefer cutting to raising. Hustles already released keep the fee
        recorded on their own row and are never restated.
      </p>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.saved && !state.error ? (
        <p className="text-sm text-emerald-400">
          Saved — the app quotes these rates from now on, and releases are
          charged at them.
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save rate card"}
      </Button>
    </form>
  );
}
