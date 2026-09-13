"use client";

import { useActionState } from "react";
import {
  Check,
  HandCoins,
  KeyRound,
  Lock,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";

import {
  addTeamMember,
  clearSettlementRequest,
  removeMember,
  resetMemberPassword,
  setMemberStatus,
  setSettlementOpen,
  type TeamAdminState,
} from "@/lib/console/team-actions";
import type { TeamMember, MemberTotals } from "@/lib/team/data";
import { formatPhone } from "@/lib/team/phone";
import { formatHours } from "@/lib/team/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Row = TeamMember & { totals: MemberTotals };

const initial: TeamAdminState = { error: null, done: null };

const STATUS_STYLE: Record<string, string> = {
  active: "bg-accent/15 text-accent",
  invited: "bg-amber-400/15 text-amber-300",
  suspended: "bg-red-500/15 text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Signed up",
  invited: "Not signed up yet",
  suspended: "Suspended",
};

/**
 * Adding a number to the roster.
 *
 * This form is the entire gate on the team side — nobody can create
 * an account without their number being typed in here first — so it says
 * what it is doing rather than assuming whoever is looking at it already
 * knows.
 */
/**
 * The settlement switch.
 *
 * Sits at the top of the roster rather than on a settings screen of its
 * own, because this is the one thing about the team ledger that the whole
 * team is waiting on, and burying it would make it easy to forget it is
 * still off.
 *
 * Turning it on is a promise being kept, so it says out loud what will
 * happen rather than being a bare toggle.
 */
function SettlementSwitch({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(setSettlementOpen, initial);

  return (
    <form
      action={action}
      className="flex flex-wrap items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <input name="open" type="hidden" value={open ? "false" : "true"} />

      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {open ? (
            <HandCoins className="h-4 w-4 text-accent" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          Settlement is {open ? "open" : "closed"}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {open
            ? "Everyone on the team can ask to be paid from their dashboard. Requests show up on their row below."
            : "Their dashboards show a Request settlement button that explains it'll be available when sydHustle starts making revenue. Open it when that's true."}
        </p>
        {state.error ? (
          <p className="mt-2 text-sm text-red-400">{state.error}</p>
        ) : null}
        {state.done ? (
          <p className="mt-2 text-sm text-accent">{state.done}</p>
        ) : null}
      </div>

      <Button
        disabled={pending}
        type="submit"
        variant={open ? "secondary" : "default"}
      >
        {pending ? "Working…" : open ? "Close settlement" : "Open settlement"}
      </Button>
    </form>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState(addTeamMember, initial);

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-accent/30 bg-accent/[0.04] p-6"
    >
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="h-4 w-4 text-accent" />
          Add a number to the list
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          They can then sign up at sydhustle.com/team with this number and a
          password of their own. Until you add it, they can&apos;t. Their
          name isn&apos;t asked for here — they give it themselves when they
          sign up, spelled the way they spell it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-phone">Their number</Label>
          <Input
            id="member-phone"
            inputMode="tel"
            name="phone"
            placeholder="080X XXX XXXX"
            required
            type="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-note">Note (optional)</Label>
          <Input
            id="member-note"
            maxLength={200}
            name="note"
            placeholder="How you'll recognise this number"
          />
          <p className="text-xs text-muted-foreground">
            Just for you — they never see it.
          </p>
        </div>
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.done ? <p className="text-sm text-accent">{state.done}</p> : null}

      <Button disabled={pending} type="submit">
        {pending ? "Adding…" : "Add to the list"}
      </Button>
    </form>
  );
}

/** One button, one action, one piece of feedback — kept per-row so a
 * failure says which person it was about. */
function RowAction({
  action,
  children,
  className,
  fields,
  pendingLabel,
}: {
  action: (
    prev: TeamAdminState,
    formData: FormData
  ) => Promise<TeamAdminState>;
  children: React.ReactNode;
  className?: string;
  fields: Record<string, string>;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/10 disabled:opacity-50",
          className
        )}
        disabled={pending}
        type="submit"
      >
        {pending ? pendingLabel : children}
      </button>
      {state.error ? (
        <span className="max-w-64 text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}

export function TeamRoster({
  members,
  settlementOpen,
}: {
  members: Row[];
  settlementOpen: boolean;
}) {
  return (
    <div className="space-y-8">
      <SettlementSwitch open={settlementOpen} />
      <AddForm />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          On the list ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-muted-foreground">
            Nobody yet. Add the first number above.
          </p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                key={member.id}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Until someone signs up, the number IS the name —
                          it is the only thing known about the row. */}
                      <h3
                        className={cn(
                          "font-semibold tracking-tight",
                          !member.name && "font-mono"
                        )}
                      >
                        {member.name ?? formatPhone(member.phone)}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLE[member.status]
                        )}
                      >
                        {STATUS_LABEL[member.status]}
                      </span>
                      {member.settlement_requested_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                          <HandCoins className="h-3 w-3" />
                          Asked to be settled
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {member.name ? (
                        <span className="font-mono">
                          {formatPhone(member.phone)}
                        </span>
                      ) : (
                        "Name arrives when they sign up"
                      )}
                      {member.note ? ` · ${member.note}` : ""}
                    </p>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-accent">
                        {member.totals.approved}
                      </span>{" "}
                      counted ·{" "}
                      <span className="font-medium text-amber-300">
                        {member.totals.pending}
                      </span>{" "}
                      waiting
                    </p>
                    <p className="mt-0.5">
                      {formatHours(member.totals.creditedHours)} credited
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-start gap-2">
                  {member.status === "suspended" ? (
                    <RowAction
                      className="text-accent"
                      action={setMemberStatus}
                      fields={{ memberId: member.id, status: "active" }}
                      pendingLabel="Working…"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Let them back in
                    </RowAction>
                  ) : (
                    <RowAction
                      action={setMemberStatus}
                      fields={{ memberId: member.id, status: "suspended" }}
                      pendingLabel="Working…"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Suspend
                    </RowAction>
                  )}

                  <RowAction
                    action={resetMemberPassword}
                    fields={{ memberId: member.id }}
                    pendingLabel="Resetting…"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset password
                  </RowAction>

                  {member.settlement_requested_at && (
                    <RowAction
                      action={clearSettlementRequest}
                      className="text-accent"
                      fields={{ memberId: member.id }}
                      pendingLabel="Clearing…"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark request handled
                    </RowAction>
                  )}

                  <RowAction
                    className="text-red-300 hover:bg-red-500/15"
                    action={removeMember}
                    fields={{ memberId: member.id }}
                    pendingLabel="Removing…"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </RowAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
