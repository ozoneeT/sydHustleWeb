"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitWaitlist, type ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionResult = { success: false, message: "" };

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitWaitlist(formData),
    initialState
  );

  if (state.success) {
    return (
      <Card className="mx-auto max-w-lg border-accent/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-accent">You&apos;re in!</CardTitle>
          <CardDescription className="text-base">{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Haven&apos;t taken the survey yet? It only takes 2 minutes and
            directly shapes what we build.
          </p>
          <Button asChild>
            <Link href="/survey">Take the survey</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Join the waitlist</CardTitle>
        <CardDescription>
          Be first to know when sydHustle launches. No spam, ever.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="source" value="landing" />

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@university.edu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School / University</Label>
            <Input
              id="school"
              name="school"
              type="text"
              placeholder="Optional"
            />
          </div>

          {state.message && !state.success && (
            <p className="text-sm text-red-400">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Joining..." : "Join the waitlist"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
