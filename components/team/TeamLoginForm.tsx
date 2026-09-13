"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Sign-in, with a spinner that actually spins.
 *
 * This used to ask `useFormStatus()` for its pending state and always got
 * `false`. That hook reports on forms React is driving — a `<form action={
 * serverAction}>` — and this one posts natively to a route handler, which
 * the browser submits itself. React never sees it, so the button sat there
 * saying "Sign in" through the whole round trip. Sign-in checks a password
 * with scrypt and deliberately waits before rejecting a wrong one, so that
 * silence is the better part of a second on a good connection and much
 * longer on mobile data — long enough for people to press it again.
 *
 * So the flag is kept by hand. `onSubmit` fires only once the browser has
 * accepted the form's own validation, and the state never needs resetting:
 * either the navigation succeeds, or the server redirects back and the
 * whole page is fresh.
 *
 * The INPUTS are deliberately not disabled while it submits, only the
 * button. A disabled field is omitted from the submitted form data, and
 * whether React's re-render lands before or after the browser has built
 * that data is a race — one that would show up as an intermittent "that
 * number and password don't match" with no way to reproduce it.
 */
export function TeamLoginForm({ error }: { error?: string | null }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action="/team/login"
      aria-busy={submitting}
      className="space-y-5"
      method="post"
      onSubmit={() => setSubmitting(true)}
    >
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          autoComplete="tel"
          id="phone"
          inputMode="tel"
          name="phone"
          placeholder="080X XXX XXXX"
          required
          type="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
