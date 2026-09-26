"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateSkillLimits, type SkillLimitsState } from "@/lib/console/limit-actions";
import type { SkillTierLimit } from "@/lib/console/limits";

const initialState: SkillLimitsState = { error: null, saved: false };

export function SkillLimitsForm({ limits }: { limits: SkillTierLimit[] }) {
  const [state, formAction, pending] = useActionState(updateSkillLimits, initialState);

  return (
    <form action={formAction}>
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">Skill limits</h2>
          <p className="text-sm text-muted-foreground">
            Set the maximum number of live Skills a Hustler may offer at each
            tier. Changes are read from the database by the app and apply to
            new Skill publications right after saving. Existing Skills remain
            available if a limit is lowered; the limit prevents adding more
            until the live count is below it.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Hustler tier</th>
                <th className="py-2">Maximum live Skills</th>
              </tr>
            </thead>
            <tbody>
              {limits.map((row) => (
                <tr className="border-b border-white/5" key={row.tier_id}>
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2">
                    <Input
                      className="h-9 w-32 font-mono text-sm"
                      defaultValue={row.max_skills}
                      min={row.rung === 0 ? 1 : 0}
                      max={20}
                      name={`skill.${row.rung}.max_skills`}
                      step={1}
                      type="number"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={pending} type="submit">
            {pending ? "Saving…" : "Save Skill limits"}
          </Button>
          {state.error ? <span className="text-sm text-red-400">{state.error}</span> : null}
          {state.saved ? (
            <span className="text-sm text-emerald-400">
              Saved. Updated limits apply to new publications now.
            </span>
          ) : null}
        </div>
      </Card>
    </form>
  );
}
