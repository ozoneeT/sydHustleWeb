"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The pending state is tracked by hand rather than with `useFormStatus`.
 *
 * That hook reports on forms React is driving; this one posts natively to
 * a route handler, so React never sees the submission and `pending` was
 * permanently false — the button said "Sign in" through the entire round
 * trip, scrypt included. Not disabling the inputs is deliberate too: a
 * disabled field is left out of the submitted data, and racing the
 * browser's serialisation would fail as a random wrong-password.
 */
export function ConsoleLoginForm({ error }: { error?: string | null }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action="/console/login"
      aria-busy={submitting}
      className="space-y-5"
      method="post"
      onSubmit={() => setSubmitting(true)}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="username"
          id="email"
          name="email"
          placeholder="you@sydhustle.com"
          required
          type="email"
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
