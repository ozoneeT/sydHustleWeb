"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";

import { acceptInvitation, type AcceptState } from "@/lib/console/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: AcceptState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Setting it up…" : "Set password and sign in"}
    </Button>
  );
}

/** Shown as you type, so the rule is met before the form is submitted
 * rather than explained after it's rejected. */
function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5",
        met ? "text-accent" : "text-muted-foreground"
      )}
    >
      {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {children}
    </li>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvitation, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="password">Choose a password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Type it again</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <ul className="space-y-1 text-xs">
        <Rule met={password.length >= 12}>At least 12 characters</Rule>
        <Rule met={confirm.length > 0 && password === confirm}>
          Both entries match
        </Rule>
      </ul>

      <p className="text-xs text-muted-foreground">
        A short phrase you&apos;ll remember beats a scramble you&apos;ll write
        down. This account can open real money and real user records — don&apos;t
        reuse a password from anywhere else.
      </p>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
