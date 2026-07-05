"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginModerator, type LoginResult } from "@/lib/moderator/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/motion/Reveal";

const initialState: LoginResult = { success: false, message: "" };

export function ModeratorLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginModerator,
    initialState
  );

  return (
    <Reveal className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Moderator login</CardTitle>
          <CardDescription>
            Enter your name and PIN to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="6-digit PIN"
                className="tracking-[0.3em]"
                required
              />
            </div>

            {state.message && <p className="text-sm text-red-400">{state.message}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have a PIN yet?{" "}
            <Link href="/moderator/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </Reveal>
  );
}
