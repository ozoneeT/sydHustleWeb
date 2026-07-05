"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitSurvey, type ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const initialState: ActionResult = { success: false, message: "" };

const hustleTypeOptions = [
  { value: "freelancing", label: "Freelancing" },
  { value: "tutoring", label: "Tutoring" },
  { value: "resale", label: "Resale / flipping" },
  { value: "content_creation", label: "Content creation" },
  { value: "gig_work", label: "Delivery / gig work" },
  { value: "campus_services", label: "Campus services" },
];

const challengeOptions = [
  { value: "finding_clients", label: "Finding clients" },
  { value: "time_management", label: "Time management" },
  { value: "getting_paid", label: "Getting paid" },
  { value: "legal_tax", label: "Legal / tax" },
  { value: "marketing", label: "Marketing myself" },
  { value: "balancing_studies", label: "Balancing studies" },
  { value: "dont_know_start", label: "Don't know where to start" },
];

const featureOptions = [
  { value: "marketplace", label: "Marketplace to find gigs" },
  { value: "community", label: "Student community" },
  { value: "templates_tools", label: "Templates & tools" },
  { value: "mentorship", label: "Mentorship" },
  { value: "payment_invoicing", label: "Payment & invoicing" },
  { value: "learning_resources", label: "Learning resources" },
];

function CheckboxGroup({
  name,
  options,
  otherName,
  otherPlaceholder,
}: {
  name: string;
  options: { value: string; label: string }[];
  otherName?: string;
  otherPlaceholder?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors hover:border-accent/30 has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              className="h-4 w-4 rounded border-white/20 accent-accent"
            />
            {option.label}
          </label>
        ))}
      </div>
      {otherName && (
        <Input
          name={otherName}
          placeholder={otherPlaceholder ?? "Other (optional)"}
        />
      )}
    </div>
  );
}

function RadioGroup({
  name,
  options,
  required,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors hover:border-accent/30 has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            required={required}
            onChange={() => onChange?.(option.value)}
            className="h-4 w-4 accent-accent"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border-b border-white/10 pb-8">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SurveyForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitSurvey(formData),
    initialState
  );
  const [isStudent, setIsStudent] = useState<string>("");
  const [hasSideHustle, setHasSideHustle] = useState<string>("");

  if (state.success) {
    return (
      <Card className="mx-auto max-w-2xl border-accent/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-accent">Thank you!</CardTitle>
          <CardDescription className="text-base">{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your feedback directly helps us decide whether to build sydHustle
            and what to prioritise first.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/#waitlist">Join the waitlist</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showHustleDetails =
    hasSideHustle === "yes" || hasSideHustle === "before";

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Student side hustle survey</CardTitle>
        <CardDescription>
          ~2 minutes. Anonymous. Helps us decide if sydHustle is worth building.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-8">
          <Section title="1. Are you currently a student?">
            <RadioGroup
              name="isStudent"
              required
              onChange={setIsStudent}
              options={[
                { value: "university", label: "Yes — university" },
                { value: "college", label: "Yes — college or TAFE" },
                { value: "high_school", label: "Yes — high school" },
                { value: "not_student", label: "No" },
              ]}
            />
          </Section>

          {isStudent === "not_student" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              This survey is designed for students, but you can still continue
              if you&apos;d like to share your perspective.
            </div>
          )}

          <Section title="2. Do you currently have a side hustle?">
            <RadioGroup
              name="hasSideHustle"
              required
              onChange={setHasSideHustle}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "before", label: "Had one before, not now" },
              ]}
            />
          </Section>

          {showHustleDetails && (
            <>
              <Section
                title="3. What kind of side hustle?"
                description="Select all that apply"
              >
                <CheckboxGroup
                  name="hustleTypes"
                  options={hustleTypeOptions}
                  otherName="hustleOther"
                  otherPlaceholder="Other type (optional)"
                />
              </Section>

              <Section title="4. Hours per week on your side hustle">
                <RadioGroup
                  name="hoursPerWeek"
                  options={[
                    { value: "0", label: "0 hours" },
                    { value: "1-5", label: "1–5 hours" },
                    { value: "6-10", label: "6–10 hours" },
                    { value: "10+", label: "10+ hours" },
                  ]}
                />
              </Section>
            </>
          )}

          <Section
            title="5. Biggest challenge with side hustles as a student"
            description="Select all that apply"
          >
            <CheckboxGroup
              name="challenges"
              options={challengeOptions}
              otherName="challengeOther"
              otherPlaceholder="Other challenge (optional)"
            />
          </Section>

          <Section
            title="6. What would help you most?"
            description="Select all that apply"
          >
            <CheckboxGroup name="desiredFeatures" options={featureOptions} />
          </Section>

          <Section title="7. How interested would you be in a platform built for student side hustlers?">
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className="flex cursor-pointer flex-col items-center gap-1"
                >
                  <input
                    type="radio"
                    name="interestScore"
                    value={score}
                    required
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-semibold transition-all",
                      "peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground"
                    )}
                  >
                    {score}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {score === 1
                      ? "Not at all"
                      : score === 5
                        ? "Extremely"
                        : ""}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="8. Would you use sydHustle if it launched in the next 6 months?">
            <RadioGroup
              name="wouldUse"
              required
              options={[
                { value: "definitely", label: "Definitely" },
                { value: "probably", label: "Probably" },
                { value: "maybe", label: "Maybe" },
                { value: "probably_not", label: "Probably not" },
                { value: "definitely_not", label: "Definitely not" },
              ]}
            />
          </Section>

          <Section title="9. Would you pay for premium features?">
            <p className="text-sm text-muted-foreground">
              e.g. invoicing, verified profile, priority listings
            </p>
            <RadioGroup
              name="wouldPay"
              required
              options={[
                { value: "yes", label: "Yes" },
                { value: "maybe", label: "Maybe" },
                { value: "no", label: "No" },
              ]}
            />
          </Section>

          <Section title="10. What would make you trust a new platform like this?">
            <Textarea
              name="trustFactors"
              placeholder="Optional — e.g. student verification, reviews, secure payments..."
              rows={3}
            />
          </Section>

          <Section title="11. Get early access (optional)">
            <div className="space-y-2">
              <Label htmlFor="survey-email">Email</Label>
              <Input
                id="survey-email"
                name="email"
                type="email"
                placeholder="you@university.edu"
              />
            </div>
          </Section>

          <Section title="12. Anything else we should know?">
            <Textarea
              name="additionalFeedback"
              placeholder="Optional — share anything on your mind"
              rows={4}
            />
          </Section>

          {state.message && !state.success && (
            <p className="text-sm text-red-400">{state.message}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit survey"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
