"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function ConsoleLoginForm({ error }: { error?: string | null }) {
  return (
    <form action="/console/login" className="space-y-5" method="post">
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

      <SubmitButton />
    </form>
  );
}
