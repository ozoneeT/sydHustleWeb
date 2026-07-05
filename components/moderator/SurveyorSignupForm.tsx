"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Copy, KeyRound } from "lucide-react";
import { signUpSurveyor, type SignupResult } from "@/lib/moderator/actions";
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

const initialState: SignupResult = { success: false, message: "" };

export function SurveyorSignupForm() {
  const [state, formAction, isPending] = useActionState(
    signUpSurveyor,
    initialState
  );
  const [copied, setCopied] = useState(false);

  if (state.success) {
    return (
      <Reveal className="mx-auto max-w-md">
        <Card className="border-accent/30">
          <CardHeader className="items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"
            >
              <KeyRound className="h-7 w-7" />
            </motion.div>
            <CardTitle className="text-2xl">You&apos;re all set, {state.name}!</CardTitle>
            <CardDescription>
              Save this PIN — you&apos;ll need it to log in and to share with
              the students you survey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-6 py-5">
              <span className="text-4xl font-bold tracking-[0.3em] text-accent">
                {state.pin}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(state.pin);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-full border border-white/10 p-2 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
                aria-label="Copy PIN"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Every survey response collected with this PIN will show up on
              your dashboard.
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href="/moderator">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    );
  }

  return (
    <Reveal className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Surveyor sign up</CardTitle>
          <CardDescription>
            Enter your name and we&apos;ll generate your unique surveyor PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your full name"
                required
                minLength={2}
              />
            </div>

            {!state.success && state.message && (
              <p className="text-sm text-red-400">{state.message}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? "Generating PIN..." : "Get my PIN"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have a PIN?{" "}
            <Link href="/moderator" className="text-accent hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </Reveal>
  );
}
