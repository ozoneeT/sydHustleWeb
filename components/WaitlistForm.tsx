"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { submitWaitlist, type ActionResult } from "@/lib/actions";
import { sendEmailVerificationCode, verifyEmailCode } from "@/lib/email/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/Reveal";

const initialState: ActionResult = { success: false, message: "" };

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "details" | "verify";

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitWaitlist(formData),
    initialState
  );

  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [code, setCode] = useState("");

  const [emailCodeSentFor, setEmailCodeSentFor] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSendError, setEmailSendError] = useState("");
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeVerifyError, setCodeVerifyError] = useState("");

  const handleSendCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_FORMAT_RE.test(normalized)) {
      setEmailSendError("Please enter a valid email address.");
      return;
    }

    setEmailSendError("");
    setEmailSending(true);
    const result = await sendEmailVerificationCode(normalized);
    setEmailSending(false);

    if (!result.success) {
      setEmailSendError(result.message);
      return;
    }

    setEmailCodeSentFor(normalized);
    setStep("verify");
  };

  const handleResendCode = async () => {
    const normalized = email.trim().toLowerCase();
    setCodeVerifyError("");
    setEmailSending(true);
    const result = await sendEmailVerificationCode(normalized);
    setEmailSending(false);

    if (!result.success) {
      setCodeVerifyError(result.message);
      return;
    }

    setEmailCodeSentFor(normalized);
    setCode("");
  };

  const handleVerifyAndJoin = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeVerifyError("Please enter the 6-digit code.");
      return;
    }

    setCodeVerifyError("");
    setCodeVerifying(true);
    const result = await verifyEmailCode(email.trim().toLowerCase(), code.trim());
    setCodeVerifying(false);

    if (!result.valid) {
      setCodeVerifyError(result.message ?? "Invalid code. Please try again.");
      return;
    }

    const fd = new FormData();
    fd.set("email", email.trim());
    fd.set("name", name.trim());
    fd.set("school", school.trim());
    fd.set("source", "landing");
    startTransition(() => {
      formAction(fd);
    });
  };

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
                  {step === "details"
                    ? "Be first to know when sydHustle launches. No spam, ever."
                    : "Enter the 6-digit code we just sent to confirm it's really you."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === "details" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@university.edu"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailSendError("");
                        }}
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school">School / University</Label>
                      <Input
                        id="school"
                        name="school"
                        type="text"
                        placeholder="Optional"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                      />
                    </div>

                    {emailSendError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-400"
                      >
                        {emailSendError}
                      </motion.p>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      disabled={emailSending}
                      onClick={handleSendCode}
                    >
                      {emailSending ? "Sending code..." : "Send verification code"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to{" "}
                      <span className="text-foreground">
                        {emailCodeSentFor}
                      </span>
                      .
                    </p>
                    <Input
                      id="waitlist-verification-code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="6-digit code"
                      className="text-center text-lg tracking-[0.3em]"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />

                    {(codeVerifyError || (state.message && !state.success)) && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-400"
                      >
                        {codeVerifyError || state.message}
                      </motion.p>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      disabled={codeVerifying || isPending}
                      onClick={handleVerifyAndJoin}
                    >
                      {codeVerifying
                        ? "Verifying..."
                        : isPending
                          ? "Joining..."
                          : "Verify & join waitlist"}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => setStep("details")}
                        className="text-muted-foreground hover:underline"
                      >
                        Edit email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={emailSending}
                        className="text-accent hover:underline disabled:opacity-50 disabled:no-underline"
                      >
                        {emailSending ? "Sending..." : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  );
}
