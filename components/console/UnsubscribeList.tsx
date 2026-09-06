"use client";

import { useActionState } from "react";
import { Check, Undo2 } from "lucide-react";

import {
  addUnsubscribe,
  removeUnsubscribe,
  type UnsubscribeState,
} from "@/lib/console/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Unsubscribe } from "@/lib/console/campaigns";

const initial: UnsubscribeState = { error: null, done: null };

const REASON_LABEL: Record<string, string> = {
  user: "Asked to stop",
  bounced: "Address doesn't exist",
  complained: "Marked us as spam",
  manual: "Added by hand",
};

export function UnsubscribeList({ rows }: { rows: Unsubscribe[] }) {
  const [state, action, pending] = useActionState(addUnsubscribe, initial);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <h2 className="text-sm font-semibold">Add an address by hand</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            For someone who asked to be taken off by reply, in person, or on
            WhatsApp.
          </p>
        </div>
        <div className="flex gap-2">
          <Input name="email" type="email" required placeholder="someone@example.com" />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state.done && (
          <p className="flex items-center gap-1.5 text-sm text-accent">
            <Check className="h-4 w-4" /> {state.done} won&apos;t be mailed again.
          </p>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted-foreground">
          Nobody has unsubscribed yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.email}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {REASON_LABEL[row.reason] ?? row.reason}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeUnsubscribe}>
                      <input type="hidden" name="email" value={row.email} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Undo2 className="h-3.5 w-3.5" />
                        Resubscribe
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
