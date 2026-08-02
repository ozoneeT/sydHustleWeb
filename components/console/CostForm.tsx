"use client";

import { useActionState, useState } from "react";

import { addCost, type CostFormState } from "@/lib/console/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CostFormState = { error: null, saved: false };

const CATEGORIES = [
  { value: "service", label: "Service" },
  { value: "maintenance", label: "Maintenance" },
  { value: "promotion", label: "Promotion" },
  { value: "publicity", label: "Publicity" },
  { value: "other", label: "Other" },
];

const today = () => new Date().toISOString().slice(0, 10);

/** What the edit flow hands back into the form. A plain shape rather than
 * the server module's CostRow — this file is client code. */
export type EditableCost = {
  id: string;
  name: string;
  category: string;
  kind: "recurring" | "one_off";
  cycle: "monthly" | "yearly" | null;
  started_on: string | null;
  spent_on: string | null;
  currency: "NGN" | "USD";
  amount: number;
  fx_rate: number | null;
  note: string | null;
};

export function CostForm({ initial }: { initial?: EditableCost }) {
  const [state, formAction, pending] = useActionState(addCost, initialState);

  const [kind, setKind] = useState<"recurring" | "one_off">(
    initial?.kind ?? "recurring"
  );
  const [currency, setCurrency] = useState<"NGN" | "USD">(
    initial?.currency ?? "NGN"
  );
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : ""
  );
  const [fxRate, setFxRate] = useState(
    initial?.fx_rate ? String(initial.fx_rate) : ""
  );

  const amountNumber = Number(amount);
  const fxNumber = Number(fxRate);
  const nairaPreview =
    currency === "USD" && amountNumber > 0 && fxNumber > 0
      ? Math.round(amountNumber * fxNumber * 100) / 100
      : null;

  return (
    <form action={formAction} className="space-y-5">
      {initial ? <input name="id" type="hidden" value={initial.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">What is it?</Label>
        <Input
          defaultValue={initial?.name}
          id="name"
          maxLength={80}
          name="name"
          placeholder="e.g. Supabase Pro, Instagram ads, domain renewal"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            className="h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm"
            defaultValue={initial?.category ?? "service"}
            id="category"
            name="category"
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            {(
              [
                { value: "recurring", label: "Recurring" },
                { value: "one_off", label: "One-off" },
              ] as const
            ).map((option) => (
              <label
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${
                  kind === option.value
                    ? "border-accent/60 bg-white/10 font-semibold"
                    : "border-white/10 text-muted-foreground"
                }`}
                key={option.value}
              >
                <input
                  checked={kind === option.value}
                  className="sr-only"
                  name="kind"
                  onChange={() => setKind(option.value)}
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {kind === "recurring" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cycle">Billed</Label>
            <select
              className="h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm"
              defaultValue={initial?.cycle ?? "monthly"}
              id="cycle"
              name="cycle"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="started_on">Paying since</Label>
            <Input
              defaultValue={initial?.started_on ?? today()}
              id="started_on"
              name="started_on"
              type="date"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="spent_on">Spent on</Label>
          <Input
            defaultValue={initial?.spent_on ?? today()}
            id="spent_on"
            name="spent_on"
            type="date"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            className="h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm"
            id="currency"
            name="currency"
            onChange={(event) =>
              setCurrency(event.target.value as "NGN" | "USD")
            }
            value={currency}
          >
            <option value="NGN">₦ Naira</option>
            <option value="USD">$ US Dollar</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount ({currency === "USD" ? "$" : "₦"})
          </Label>
          <Input
            id="amount"
            min="0.01"
            name="amount"
            onChange={(event) => setAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={amount}
          />
        </div>
      </div>

      {currency === "USD" ? (
        <div className="space-y-2">
          <Label htmlFor="fx_rate">Exchange rate (₦ per $1)</Label>
          <Input
            id="fx_rate"
            min="0.01"
            name="fx_rate"
            onChange={(event) => setFxRate(event.target.value)}
            placeholder="e.g. 1600"
            required
            step="0.01"
            type="number"
            value={fxRate}
          />
          <p className="text-xs text-muted-foreground">
            {nairaPreview !== null
              ? `Books as ₦${nairaPreview.toLocaleString("en-NG")} — frozen at this rate.`
              : "The rate you actually paid at; the naira value is frozen at entry."}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          defaultValue={initial?.note ?? undefined}
          id="note"
          maxLength={300}
          name="note"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.saved && !state.error ? (
        <p className="text-sm text-emerald-400">Added to the cost sheet.</p>
      ) : null}

      <div className="flex items-center gap-4">
        <Button disabled={pending} type="submit">
          {pending
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Add cost"}
        </Button>
        {initial ? (
          <a
            className="text-sm text-muted-foreground hover:underline"
            href="/console/costs"
          >
            Cancel
          </a>
        ) : null}
      </div>
    </form>
  );
}
