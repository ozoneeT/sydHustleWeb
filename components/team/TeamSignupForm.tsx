"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { signUpMember, type SignupState } from "@/lib/team/signup-actions";
import { TEAM_MIN_PASSWORD_LENGTH } from "@/lib/team/password-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: SignupState = { error: null };

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

export function TeamSignupForm() {
  // This one IS driven by React, so `pending` is real — unlike the sign-in
  // form next door, which posts natively and has to track it by hand.
  // Signup hashes a password with scrypt, which is ~100ms of deliberate
  // work on top of the round trip, so the spinner earns its place.
  const [state, action, pending] = useActionState(signUpMember, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="phone">Your phone number</Label>
        <Input
          autoComplete="tel"
          id="phone"
          inputMode="tel"
          name="phone"
          placeholder="080X XXX XXXX"
          required
          type="tel"
        />
        <p className="text-xs text-muted-foreground">
          It has to be the number that was added for you. Write it however you
          normally would.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          autoComplete="name"
          id="name"
          maxLength={80}
          name="name"
          required
        />
        <p className="text-xs text-muted-foreground">
          The name you want to be addressed by. It goes on every contribution you post, so spell it the
          way you want it to appear.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Choose a password</Label>
        <Input
          autoComplete="new-password"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Type it again</Label>
        <Input
          autoComplete="new-password"
          id="confirm"
          name="confirm"
          onChange={(e) => setConfirm(e.target.value)}
          required
          type="password"
          value={confirm}
        />
      </div>

      <ul className="space-y-1 text-xs">
        <Rule met={password.length >= TEAM_MIN_PASSWORD_LENGTH}>
          At least {TEAM_MIN_PASSWORD_LENGTH} characters
        </Rule>
        <Rule met={confirm.length > 0 && password === confirm}>
          Both entries match
        </Rule>
      </ul>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Setting it up…" : "Create my account"}
      </Button>
    </form>
  );
}
