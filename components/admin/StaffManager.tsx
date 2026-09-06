"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";

import {
  deleteStaff,
  inviteStaff,
  resendInvite,
  setStaffRoles,
  setStaffStatus,
  type InviteState,
  type StaffActionState,
} from "@/lib/admin/actions";
import type { ConsoleRole, StaffMember } from "@/lib/console/staff";
import { tabLabel } from "@/lib/console/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialInvite: InviteState = { error: null, invited: null };
const initialAction: StaffActionState = { error: null, done: null };

const STATUS_STYLE: Record<string, string> = {
  active: "bg-accent/15 text-accent",
  invited: "bg-amber-400/15 text-amber-300",
  suspended: "bg-red-500/15 text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

function RolePicker({
  roles,
  selected,
  onChange,
  name,
}: {
  roles: ConsoleRole[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  name: string;
}) {
  return (
    <>
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const on = selected.has(role.id);
          return (
            <button
              key={role.id}
              type="button"
              title={role.permissions.map(tabLabel).join(", ")}
              onClick={() => {
                const next = new Set(selected);
                if (next.has(role.id)) next.delete(role.id);
                else next.add(role.id);
                onChange(next);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              {on && <Check className="h-3.5 w-3.5" />}
              {role.name}
              <span className="opacity-60">{role.permissions.length}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function InviteForm({ roles }: { roles: ConsoleRole[] }) {
  const [state, action, pending] = useActionState(inviteStaff, initialInvite);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-accent/30 bg-accent/[0.04] p-6"
    >
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="h-4 w-4 text-accent" />
          Invite someone to the console
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          They get an email with a one-time link, choose their own password,
          and land straight on the first tab their role opens.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Their name</Label>
          <Input id="invite-name" name="name" required placeholder="Emmanuel Praise" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Their email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="emmanuel@sydhustle.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Roles</Label>
        {roles.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            Create a role first — an invitation with no role lets someone sign
            in to a console with nothing in it.
          </p>
        ) : (
          <RolePicker
            roles={roles}
            selected={selected}
            onChange={setSelected}
            name="roleIds"
          />
        )}
      </div>

      {state.error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      {state.invited && (
        <p
          className={cn(
            "rounded-xl border p-3 text-sm",
            state.invited.emailed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          )}
        >
          {state.invited.emailed
            ? `Invitation sent to ${state.invited.email}.`
            : `${state.invited.email} was added, but the email didn't send. Use "Resend invite" below once Resend is configured.`}
        </p>
      )}

      <Button type="submit" disabled={pending || roles.length === 0}>
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}

function StaffRow({
  member,
  roles,
  pendingInviteExpiry,
}: {
  member: StaffMember;
  roles: ConsoleRole[];
  pendingInviteExpiry?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(member.roles.map((role) => role.id))
  );
  const [rolesState, rolesAction, savingRoles] = useActionState(
    setStaffRoles,
    initialAction
  );
  const [resendState, resendAction, resending] = useActionState(
    resendInvite,
    initialAction
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {member.name}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  STATUS_STYLE[member.status]
                )}
              >
                {STATUS_LABEL[member.status]}
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {member.email} ·{" "}
              {member.roles.length > 0
                ? member.roles.map((role) => role.name).join(", ")
                : "no role"}
              {member.last_login_at
                ? ` · last in ${new Date(member.last_login_at).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        </button>
      </div>

      {open && (
        <div className="space-y-5 border-t border-white/10 px-5 py-5">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              What they can open
            </p>
            <p className="text-sm">
              {member.permissions.length > 0
                ? member.permissions.map(tabLabel).join(" · ")
                : "Nothing yet."}
            </p>
          </div>

          <form action={rolesAction} className="space-y-3">
            <input type="hidden" name="staffId" value={member.id} />
            <Label>Roles</Label>
            <RolePicker
              roles={roles}
              selected={selected}
              onChange={setSelected}
              name="roleIds"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={savingRoles}>
                {savingRoles ? "Saving…" : "Save roles"}
              </Button>
              {rolesState.done && (
                <span className="text-sm text-accent">{rolesState.done}</span>
              )}
              {rolesState.error && (
                <span className="text-sm text-red-400">{rolesState.error}</span>
              )}
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            {member.status === "invited" && (
              <form action={resendAction}>
                <input type="hidden" name="staffId" value={member.id} />
                <Button type="submit" variant="secondary" size="sm" disabled={resending}>
                  <Mail className="h-3.5 w-3.5" />
                  {resending ? "Sending…" : "Resend invite"}
                </Button>
              </form>
            )}

            {member.status === "active" && (
              <form action={setStaffStatus}>
                <input type="hidden" name="staffId" value={member.id} />
                <input type="hidden" name="status" value="suspended" />
                <Button type="submit" variant="secondary" size="sm">
                  Suspend
                </Button>
              </form>
            )}

            {member.status === "suspended" && (
              <form action={setStaffStatus}>
                <input type="hidden" name="staffId" value={member.id} />
                <input type="hidden" name="status" value="active" />
                <Button type="submit" variant="secondary" size="sm">
                  Reinstate
                </Button>
              </form>
            )}

            <form action={deleteStaff}>
              <input type="hidden" name="staffId" value={member.id} />
              <Button type="submit" variant="ghost" size="sm">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </form>

            {resendState.done && (
              <span className="text-sm text-accent">{resendState.done}</span>
            )}
            {resendState.error && (
              <span className="text-sm text-red-400">{resendState.error}</span>
            )}
          </div>

          {member.status === "invited" && pendingInviteExpiry && (
            <p className="text-xs text-muted-foreground">
              Their invitation link expires{" "}
              {new Date(pendingInviteExpiry).toLocaleDateString()}. Suspending
              is reversible; deleting is not.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function StaffManager({
  staff,
  roles,
  inviteExpiry,
}: {
  staff: StaffMember[];
  roles: ConsoleRole[];
  inviteExpiry: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <InviteForm roles={roles} />

      {staff.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted-foreground">
          No staff yet. The console still works — you&apos;re signed in as the
          owner, which holds every tab.
        </p>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              roles={roles}
              pendingInviteExpiry={inviteExpiry[member.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
