"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { submitWaitlist, type ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/Reveal";

const initialState: ActionResult = { success: false, message: "" };

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitWaitlist(formData),
    initialState
  );

  return (
    <Reveal className="mx-auto max-w-lg">
      <AnimatePresence mode="wait">
        {state.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Card className="border-accent/30 shadow-accent/10">
              <CardHeader className="items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"
                >
                  <CheckCircle2 className="h-7 w-7" />
                </motion.div>
                <CardTitle className="text-2xl text-accent">
                  You&apos;re in!
                </CardTitle>
                <CardDescription className="text-base">
                  {state.message}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  Haven&apos;t taken the survey yet? It only takes a few
                  minutes and directly shapes what we build.
                </p>
                <Button asChild>
                  <Link href="/survey">Take the survey</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
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
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Optional"
                    />
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
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400"
                    >
                      {state.message}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Joining..." : "Join the waitlist"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  );
}
