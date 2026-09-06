"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";

import { deleteRole, saveRole, type RoleState } from "@/lib/admin/actions";
import type { ConsoleRole } from "@/lib/console/staff";
import { CONSOLE_TABS, CONSOLE_TAB_GROUPS } from "@/lib/console/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initial: RoleState = { error: null };

/**
 * The tab picker, grouped exactly as the console's own sidebar groups them
 * — so "give them the Books" is one glance and one click per group rather
 * than eight checkboxes hunted out of a flat list.
 */
function TabPicker({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  function toggleGroup(group: string, on: boolean) {
    const next = new Set(selected);
    for (const tab of CONSOLE_TABS) {
      if (tab.group !== group) continue;
      if (on) next.add(tab.key);
      else next.delete(tab.key);
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {CONSOLE_TAB_GROUPS.map((group) => {
        const tabs = CONSOLE_TABS.filter((tab) => tab.group === group);
        const allOn = tabs.every((tab) => selected.has(tab.key));

        return (
          <div key={group} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group}
              </p>
              <button
                type="button"
                onClick={() => toggleGroup(group, !allOn)}
                className="text-xs text-muted-foreground transition-colors hover:text-accent"
              >
                {allOn ? "Clear group" : "Select all"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const on = selected.has(tab.key);
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => toggle(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      on
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleForm({
  role,
  onDone,
}: {
  role?: ConsoleRole;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveRole.bind(null, role?.id ?? null),
    initial
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role?.permissions ?? ["overview"])
  );

  return (
    <form action={action} className="space-y-5">
      {[...selected].map((key) => (
        <input key={key} type="hidden" name="permissions" value={key} />
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`name-${role?.id ?? "new"}`}>Role name</Label>
          <Input
            id={`name-${role?.id ?? "new"}`}
            name="name"
            required
            defaultValue={role?.name}
            placeholder="Support"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`description-${role?.id ?? "new"}`}>
            What it&apos;s for (optional)
          </Label>
          <Textarea
            id={`description-${role?.id ?? "new"}`}
            name="description"
            rows={1}
            defaultValue={role?.description ?? ""}
            placeholder="Day-to-day user contact"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tabs this role opens</Label>
        <TabPicker selected={selected} onChange={setSelected} />
        <p className="text-xs text-muted-foreground">
          {selected.size === 0
            ? "No tabs picked — anyone with only this role will sign in and see nothing."
            : `${selected.size} ${selected.size === 1 ? "tab" : "tabs"} selected.`}
        </p>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : role ? "Save role" : "Create role"}
        </Button>
        {onDone && (
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        )}
        {state.saved && !pending && (
          <span className="flex items-center gap-1.5 text-sm text-accent">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

export function RoleEditor({
  roles,
  holderCounts,
}: {
  roles: ConsoleRole[];
  holderCounts: Record<string, number>;
}) {
  const [creating, setCreating] = useState(roles.length === 0);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {creating ? (
        <section className="rounded-2xl border border-accent/30 bg-accent/[0.04] p-6">
          <h2 className="mb-4 text-sm font-semibold">New role</h2>
          <RoleForm onDone={() => setCreating(false)} />
        </section>
      ) : (
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New role
        </Button>
      )}

      <div className="space-y-3">
        {roles.map((role) => {
          const open = editing === role.id;
          const holders = holderCounts[role.id] ?? 0;

          return (
            <div
              key={role.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setEditing(open ? null : role.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{role.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {role.permissions.length}{" "}
                      {role.permissions.length === 1 ? "tab" : "tabs"} ·{" "}
                      {holders === 0
                        ? "nobody holds it"
                        : `${holders} ${holders === 1 ? "person" : "people"}`}
                      {role.description ? ` · ${role.description}` : ""}
                    </p>
                  </div>
                </button>

                <form action={deleteRole}>
                  <input type="hidden" name="roleId" value={role.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </form>
              </div>

              {open && (
                <div className="border-t border-white/10 px-5 py-5">
                  {holders > 0 && (
                    <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      {holders} {holders === 1 ? "person holds" : "people hold"} this
                      role. Changing its tabs changes what they can open, on their
                      next click.
                    </p>
                  )}
                  <RoleForm role={role} onDone={() => setEditing(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
