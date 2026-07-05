"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { submitSurvey, type ActionResult } from "@/lib/actions";
import { verifyModeratorPin } from "@/lib/moderator/actions";
import { sendEmailVerificationCode, verifyEmailCode } from "@/lib/email/actions";
import { allHustlesRated, hustleTaskOptions } from "@/lib/hustle-tasks";
import {
  concernOptions,
  skillOptions,
  trustFactorOptions,
  uninstallOptions,
} from "@/lib/survey-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const initialState: ActionResult = { success: false, message: "" };

type HustleCapability = "can_do" | "cannot_do";

interface Answers {
  moderatorPin: string;
  surveyorId: string;
  isStudent: string;
  needsExtraIncome: string;
  wantsSideHustle: string;
  hustleFrequency: string;
  hoursPerDay: number;
  hoursPerDayTouched: boolean;
  hasSkill: string;
  skills: string[];
  skillsOther: string;
  willingDifferentHustle: string;
  hustleCapability: Record<string, HustleCapability>;
  needsTaskHelp: string;
  taskHelpTypes: string[];
  taskHelpOther: string;
  wouldUseApp: string;
  embarrassedWithMate: string;
  appUsageRole: string;
  uninstallReasons: string[];
  uninstallOther: string;
  concerns: string[];
  concernsOther: string;
  trustFactors: string[];
  trustFactorsOther: string;
  paymentPreference: string;
  commissionWillingness: string;
  email: string;
  name: string;
  school: string;
  emailVerified: boolean;
  emailCodeSentFor: string;
  verificationCode: string;
  additionalFeedback: string;
  joinMarketingTeam: string;
  marketingWhatsapp: string;
}

const initialAnswers: Answers = {
  moderatorPin: "",
  surveyorId: "",
  isStudent: "",
  needsExtraIncome: "",
  wantsSideHustle: "",
  hustleFrequency: "",
  hoursPerDay: 2,
  hoursPerDayTouched: false,
  hasSkill: "",
  skills: [],
  skillsOther: "",
  willingDifferentHustle: "",
  hustleCapability: {},
  needsTaskHelp: "",
  taskHelpTypes: [],
  taskHelpOther: "",
  wouldUseApp: "",
  embarrassedWithMate: "",
  appUsageRole: "",
  uninstallReasons: [],
  uninstallOther: "",
  concerns: [],
  concernsOther: "",
  trustFactors: [],
  trustFactorsOther: "",
  paymentPreference: "",
  commissionWillingness: "",
  email: "",
  name: "",
  school: "",
  emailVerified: false,
  emailCodeSentFor: "",
  verificationCode: "",
  additionalFeedback: "",
  joinMarketingTeam: "",
  marketingWhatsapp: "",
};

type StepId =
  | "moderatorPin"
  | "isStudent"
  | "needsExtraIncome"
  | "wantsSideHustle"
  | "needsTaskHelp"
  | "taskHelpTypes"
  | "hustleFrequency"
  | "hoursPerDay"
  | "hasSkill"
  | "skills"
  | "willingDifferentHustle"
  | "hustleCapability"
  | "wouldUseApp"
  | "embarrassedWithMate"
  | "appUsageRole"
  | "uninstallReasons"
  | "concerns"
  | "trustFactors"
  | "paymentPreference"
  | "commissionWillingness"
  | "email"
  | "verifyEmail"
  | "additionalFeedback"
  | "joinMarketingTeam"
  | "marketingWhatsapp";

interface StepMeta {
  id: StepId;
  title: string;
  description?: string;
  required: boolean;
  validate: (a: Answers) => boolean;
}

// Fixed, branch-independent question definitions. Required flags mirror the
// enforcement in the surveySchema in lib/actions.ts. Only
// "Anything else you'd like to share?" is optional.
function hasSelection(values: string[], other?: string) {
  return values.length > 0 || (other?.trim() ?? "") !== "";
}

function showsHustleCapability(a: Answers) {
  return (
    a.hasSkill === "no" ||
    (a.hasSkill === "yes" && a.willingDifferentHustle === "yes")
  );
}
const STEP_MODERATOR_PIN: StepMeta = {
  id: "moderatorPin",
  title: "Enter the moderator's PIN",
  description: "Ask the person surveying you for their 6-digit PIN before starting",
  required: true,
  // Only checks the PIN's shape so the "Next" button becomes clickable;
  // the actual verification (and setting of surveyorId) happens
  // asynchronously in handleNext via verifyModeratorPin.
  validate: (a) => /^\d{6}$/.test(a.moderatorPin.trim()),
};

const STEP_IS_STUDENT: StepMeta = {
  id: "isStudent",
  title: "Are you currently a student?",
  required: true,
  validate: (a) => a.isStudent !== "",
};

const STEP_NEEDS_EXTRA_INCOME: StepMeta = {
  id: "needsExtraIncome",
  title: "Do you need extra income?",
  required: true,
  validate: (a) => a.needsExtraIncome !== "",
};

const STEP_WANTS_SIDE_HUSTLE: StepMeta = {
  id: "wantsSideHustle",
  title: "Are you looking for a side hustle?",
  required: true,
  validate: (a) => a.wantsSideHustle !== "",
};

const STEP_WOULD_USE_APP: StepMeta = {
  id: "wouldUseApp",
  title:
    "If there was an app where students could offer services to other students and get paid, would you use it?",
  required: true,
  validate: (a) => a.wouldUseApp !== "",
};

const STEP_EMBARRASSED_WITH_MATE: StepMeta = {
  id: "embarrassedWithMate",
  title:
    "Would you feel embarrassed if the person you were hustling for or with was someone you know personally?",
  required: true,
  validate: (a) => a.embarrassedWithMate !== "",
};

const STEP_APP_USAGE_ROLE: StepMeta = {
  id: "appUsageRole",
  title: "Which would you primarily use the app for?",
  required: true,
  validate: (a) => a.appUsageRole !== "",
};

const STEP_UNINSTALL_REASONS: StepMeta = {
  id: "uninstallReasons",
  title: "What would make you uninstall the app?",
  description: "Select all that apply",
  required: true,
  validate: (a) => hasSelection(a.uninstallReasons, a.uninstallOther),
};

const STEP_CONCERNS: StepMeta = {
  id: "concerns",
  title: "What concerns would you have about using the app?",
  description: "Select all that apply",
  required: true,
  validate: (a) => hasSelection(a.concerns, a.concernsOther),
};

const STEP_TRUST_FACTORS: StepMeta = {
  id: "trustFactors",
  title: "What would build your trust in the app and the hustle you get matched with?",
  description: "Select all that apply",
  required: true,
  validate: (a) => hasSelection(a.trustFactors, a.trustFactorsOther),
};

const STEP_PAYMENT_PREFERENCE: StepMeta = {
  id: "paymentPreference",
  title: "Which payment method would you prefer?",
  required: true,
  validate: (a) => a.paymentPreference !== "",
};

const STEP_COMMISSION_WILLINGNESS: StepMeta = {
  id: "commissionWillingness",
  title:
    "Would you be willing to give up 10% of your earnings to sydHustle for managing the platform?",
  required: true,
  validate: (a) => a.commissionWillingness !== "",
};

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEP_EMAIL: StepMeta = {
  id: "email",
  title: "Get early access",
  description: "Join the waitlist while you're here",
  required: true,
  validate: (a) =>
    EMAIL_FORMAT_RE.test(a.email.trim()) &&
    a.name.trim() !== "" &&
    a.school.trim() !== "",
};

const STEP_VERIFY_EMAIL: StepMeta = {
  id: "verifyEmail",
  title: "Verify your email",
  description: "Enter the 6-digit code we just sent to confirm it's really you",
  required: true,
  // Only checks the code's shape so "Next" becomes clickable; the actual
  // verification happens asynchronously in handleNext via verifyEmailCode.
  validate: (a) => /^\d{6}$/.test(a.verificationCode.trim()),
};

const STEP_ADDITIONAL_FEEDBACK: StepMeta = {
  id: "additionalFeedback",
  title: "Anything else you'd like to share?",
  description: "Optional",
  required: false,
  validate: () => true,
};

const STEP_JOIN_MARKETING_TEAM: StepMeta = {
  id: "joinMarketingTeam",
  title: "Would you be willing to join the sydHustle marketing team when the app launches?",
  required: true,
  validate: (a) => a.joinMarketingTeam !== "",
};

const STEP_MARKETING_WHATSAPP: StepMeta = {
  id: "marketingWhatsapp",
  title: "Great! What's your WhatsApp number so we can reach you?",
  required: true,
  validate: (a) => a.marketingWhatsapp.trim() !== "",
};

// All "hustler" (service-provider) questions, grouped together. Shown either
// right after "Are you looking for a side hustle?" = Yes, or later if the
// respondent tells us at the role question that they'd hustle after all.
function getHustlerGroupSteps(a: Answers): StepMeta[] {
  const group: StepMeta[] = [
    {
      id: "hustleFrequency",
      title: "How often would you be able to offer your hustle?",
      required: true,
      validate: (ans) => ans.hustleFrequency !== "",
    },
    {
      id: "hoursPerDay",
      title: "How many hours per day can you spend hustling?",
      description: "Drag the slider to set your answer",
      required: true,
      validate: (ans) => ans.hoursPerDayTouched,
    },
    {
      id: "hasSkill",
      title: "Do you have a skill you could offer?",
      required: true,
      validate: (ans) => ans.hasSkill !== "",
    },
  ];

  if (a.hasSkill === "yes") {
    group.push(
      {
        id: "skills",
        title: "What skill(s) do you have?",
        description: "Select all that apply",
        required: true,
        validate: (ans) => hasSelection(ans.skills, ans.skillsOther),
      },
      {
        id: "willingDifferentHustle",
        title:
          "If there were no tasks related to your skill, would you take on a different hustle?",
        required: true,
        validate: (ans) => ans.willingDifferentHustle !== "",
      }
    );
  }

  if (showsHustleCapability(a)) {
    group.push({
      id: "hustleCapability",
      title: "Which of these hustles could you do?",
      description: "Mark every hustle as Can do or Can't do before continuing",
      required: true,
      validate: (ans) => allHustlesRated(ans.hustleCapability),
    });
  }

  return group;
}

function getProviderGroupSteps(a: Answers): StepMeta[] {
  const group: StepMeta[] = [
    {
      id: "needsTaskHelp",
      title: "Have you ever needed someone to help you with a task?",
      required: true,
      validate: (ans) => ans.needsTaskHelp !== "",
    },
  ];

  if (a.needsTaskHelp === "yes") {
    group.push({
      id: "taskHelpTypes",
      title: "What type of task do you need help with?",
      description: "Select all that apply",
      required: true,
      validate: (ans) => hasSelection(ans.taskHelpTypes, ans.taskHelpOther),
    });
  }

  return group;
}

// Builds the full, ordered list of steps a respondent will see. Hustler
// questions and task-poster questions are always kept together as a group,
// regardless of whether someone enters that group from the initial income
// question or is routed there later based on how they say they'd use the
// app ("Which would you primarily use the app for?").
function buildVisibleSteps(a: Answers): StepMeta[] {
  const order: StepMeta[] = [STEP_MODERATOR_PIN, STEP_IS_STUDENT, STEP_NEEDS_EXTRA_INCOME];

  let hustlerGroupShown = false;
  let providerGroupShown = false;

  if (a.needsExtraIncome === "yes") {
    order.push(STEP_WANTS_SIDE_HUSTLE);
    if (a.wantsSideHustle === "yes") {
      order.push(...getHustlerGroupSteps(a));
      hustlerGroupShown = true;
    } else if (a.wantsSideHustle === "no") {
      // Needs income but not via a side hustle — route into the task-poster
      // questions instead, since they're the other side of the marketplace.
      order.push(...getProviderGroupSteps(a));
      providerGroupShown = true;
    }
  } else if (a.needsExtraIncome === "no") {
    order.push(...getProviderGroupSteps(a));
    providerGroupShown = true;
  }

  order.push(STEP_WOULD_USE_APP, STEP_EMBARRASSED_WITH_MATE, STEP_APP_USAGE_ROLE);

  const wantsHustlerRetro =
    !hustlerGroupShown &&
    (a.appUsageRole === "hustling_the_hustles" || a.appUsageRole === "both");
  const wantsProviderRetro =
    !providerGroupShown &&
    (a.appUsageRole === "providing_hustles" || a.appUsageRole === "both");

  if (wantsHustlerRetro) {
    order.push(...getHustlerGroupSteps(a));
  }
  if (wantsProviderRetro) {
    order.push(...getProviderGroupSteps(a));
  }

  order.push(
    STEP_UNINSTALL_REASONS,
    STEP_CONCERNS,
    STEP_TRUST_FACTORS,
    STEP_PAYMENT_PREFERENCE,
    STEP_COMMISSION_WILLINGNESS,
    STEP_EMAIL
  );

  // Skip the verification step once the email has been confirmed — if the
  // user goes back and edits the email, emailVerified is reset (see the
  // email input's onChange below), so this step reappears automatically.
  if (!a.emailVerified) {
    order.push(STEP_VERIFY_EMAIL);
  }

  order.push(STEP_ADDITIONAL_FEEDBACK, STEP_JOIN_MARKETING_TEAM);

  if (a.joinMarketingTeam === "yes") {
    order.push(STEP_MARKETING_WHATSAPP);
  }

  return order;
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
  columns = 1,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3"
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-all hover:border-accent/30 hover:bg-white/[0.07] has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 shrink-0 accent-accent"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  value,
  onChange,
  options,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
}) {
  const toggle = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-all hover:border-accent/30 hover:bg-white/[0.07] has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10"
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 shrink-0 rounded border-white/20 accent-accent"
            />
            {option.label}
          </label>
        ))}
      </div>
      {onOtherChange && (
        <Input
          value={otherValue ?? ""}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder={otherPlaceholder ?? "Other (optional)"}
        />
      )}
    </div>
  );
}

function HustleCapabilityGrid({
  value,
  onChange,
}: {
  value: Record<string, HustleCapability>;
  onChange: (hustleKey: string, capability: HustleCapability) => void;
}) {
  return (
    <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
      {hustleTaskOptions.map((hustle) => (
        <div
          key={hustle.value}
          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm">{hustle.label}</span>
          <div className="flex shrink-0 gap-2">
            <label className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground">
              <input
                type="radio"
                name={`hustleCapability_${hustle.value}`}
                checked={value[hustle.value] === "can_do"}
                onChange={() => onChange(hustle.value, "can_do")}
                className="sr-only"
              />
              Can do
            </label>
            <label className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors has-[:checked]:border-rose-400/60 has-[:checked]:bg-rose-400/10 has-[:checked]:text-rose-300">
              <input
                type="radio"
                name={`hustleCapability_${hustle.value}`}
                checked={value[hustle.value] === "cannot_do"}
                onChange={() => onChange(hustle.value, "cannot_do")}
                className="sr-only"
              />
              Can&apos;t do
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function HoursPerDaySlider({
  value,
  touched,
  onChange,
}: {
  value: number;
  touched: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        type="range"
        min={0}
        max={24}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0h</span>
        {touched ? (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            {value} {value === 1 ? "hour" : "hours"} / day
          </span>
        ) : (
          <span className="rounded-full border border-dashed border-white/20 px-3 py-1 text-sm text-muted-foreground">
            Drag the slider to choose
          </span>
        )}
        <span>24h</span>
      </div>
    </div>
  );
}

const HUSTLE_CAPABILITY_PREFIX = "hustleCapability_";

function buildFormData(a: Answers): FormData {
  const fd = new FormData();
  fd.set("surveyorId", a.surveyorId);
  fd.set("isStudent", a.isStudent);
  fd.set("needsExtraIncome", a.needsExtraIncome);

  if (a.wantsSideHustle) fd.set("wantsSideHustle", a.wantsSideHustle);
  if (a.hustleFrequency) fd.set("hustleFrequency", a.hustleFrequency);
  if (a.hoursPerDayTouched) {
    fd.set("hoursPerDay", String(a.hoursPerDay));
    fd.set("hoursPerDayTouched", "true");
  }
  if (a.hasSkill) fd.set("hasSkill", a.hasSkill);
  a.skills.forEach((s) => fd.append("skills", s));
  if (a.skillsOther) fd.set("skillsOther", a.skillsOther);
  if (a.willingDifferentHustle)
    fd.set("willingDifferentHustle", a.willingDifferentHustle);
  Object.entries(a.hustleCapability).forEach(([key, val]) => {
    fd.set(`${HUSTLE_CAPABILITY_PREFIX}${key}`, val);
  });

  if (a.needsTaskHelp) fd.set("needsTaskHelp", a.needsTaskHelp);
  a.taskHelpTypes.forEach((t) => fd.append("taskHelpTypes", t));
  if (a.taskHelpOther) fd.set("taskHelpOther", a.taskHelpOther);

  fd.set("wouldUseApp", a.wouldUseApp);
  fd.set("embarrassedWithMate", a.embarrassedWithMate);
  fd.set("appUsageRole", a.appUsageRole);
  a.uninstallReasons.forEach((r) => fd.append("uninstallReasons", r));
  if (a.uninstallOther) fd.set("uninstallOther", a.uninstallOther);
  a.concerns.forEach((c) => fd.append("concerns", c));
  if (a.concernsOther) fd.set("concernsOther", a.concernsOther);
  a.trustFactors.forEach((t) => fd.append("trustFactors", t));
  if (a.trustFactorsOther) fd.set("trustFactorsOther", a.trustFactorsOther);
  fd.set("paymentPreference", a.paymentPreference);
  fd.set("commissionWillingness", a.commissionWillingness);

  fd.set("email", a.email);
  fd.set("name", a.name);
  fd.set("school", a.school);
  if (a.additionalFeedback) fd.set("additionalFeedback", a.additionalFeedback);

  fd.set("joinMarketingTeam", a.joinMarketingTeam);
  if (a.joinMarketingTeam === "yes") {
    fd.set("marketingWhatsapp", a.marketingWhatsapp.trim());
  }

  return fd;
}

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -28 : 28 }),
};

export function SurveyForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitSurvey(formData),
    initialState
  );

  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [currentStepId, setCurrentStepId] = useState<StepId>("moderatorPin");
  const [direction, setDirection] = useState(1);
  const [pinChecking, setPinChecking] = useState(false);
  const [pinError, setPinError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSendError, setEmailSendError] = useState("");
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeVerifyError, setCodeVerifyError] = useState("");

  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const visibleSteps = useMemo(() => buildVisibleSteps(answers), [answers]);

  // If a step the user was on disappears (e.g. they went back and changed a
  // branch answer), fall back to roughly the same depth instead of jumping
  // back to the first question. Updated directly wherever we navigate, so we
  // never need to derive it from an effect.
  const [lastKnownIndex, setLastKnownIndex] = useState(0);
  const rawIndex = visibleSteps.findIndex((s) => s.id === currentStepId);
  const currentIndex =
    rawIndex === -1 ? Math.min(lastKnownIndex, visibleSteps.length - 1) : rawIndex;

  const currentStep = visibleSteps[currentIndex] ?? visibleSteps[0];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === visibleSteps.length - 1;
  const canProceed = !currentStep.required || currentStep.validate(answers);
  const progressPct = ((currentIndex + 1) / visibleSteps.length) * 100;

  const goToIndex = (index: number) => {
    const target = visibleSteps[index];
    if (!target) return;
    setLastKnownIndex(index);
    setCurrentStepId(target.id);
  };

  const handleNext = async () => {
    if (!canProceed || isLastStep) return;

    if (currentStep.id === "moderatorPin" && !answers.surveyorId) {
      setPinError("");
      setPinChecking(true);
      const result = await verifyModeratorPin(answers.moderatorPin);
      setPinChecking(false);

      if (!result.valid || !result.surveyorId) {
        setPinError("Invalid moderator PIN. Please check and try again.");
        return;
      }

      update("surveyorId", result.surveyorId);
      setDirection(1);
      goToIndex(currentIndex + 1);
      return;
    }

    if (currentStep.id === "email" && !answers.emailVerified) {
      const email = answers.email.trim().toLowerCase();
      setEmailSendError("");

      // Already sent a code for this exact email (e.g. user went back
      // without changing it) — no need to send another one.
      if (answers.emailCodeSentFor !== email) {
        setEmailSending(true);
        const result = await sendEmailVerificationCode(email);
        setEmailSending(false);

        if (!result.success) {
          setEmailSendError(result.message);
          return;
        }

        update("emailCodeSentFor", email);
      }

      setDirection(1);
      goToIndex(currentIndex + 1);
      return;
    }

    if (currentStep.id === "verifyEmail") {
      setCodeVerifyError("");
      setCodeVerifying(true);
      const result = await verifyEmailCode(answers.email, answers.verificationCode);
      setCodeVerifying(false);

      if (!result.valid) {
        setCodeVerifyError(result.message ?? "Invalid code. Please try again.");
        return;
      }

      update("emailVerified", true);
      setDirection(1);
      goToIndex(currentIndex + 1);
      return;
    }

    setDirection(1);
    goToIndex(currentIndex + 1);
  };

  const handleResendCode = async () => {
    const email = answers.email.trim().toLowerCase();
    setCodeVerifyError("");
    setEmailSending(true);
    const result = await sendEmailVerificationCode(email);
    setEmailSending(false);

    if (!result.success) {
      setCodeVerifyError(result.message);
      return;
    }

    update("emailCodeSentFor", email);
    update("verificationCode", "");
  };

  const handleBack = () => {
    if (isFirstStep) return;
    setDirection(-1);
    goToIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    startTransition(() => {
      formAction(buildFormData(answers));
    });
  };

  if (state.success) {
    return (
      <Reveal className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <Card className="border-accent/30">
            <CardHeader className="items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <CheckCircle2 className="h-7 w-7" />
              </motion.div>
              <CardTitle className="text-3xl text-accent">Thank you!</CardTitle>
              <CardDescription className="text-base">{state.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your responses directly shape whether we build sydHustle, and
                whether we prioritise hustlers, task posters, or both.
                You&apos;re already on the waitlist — we&apos;ll email you
                when sydHustle launches.
              </p>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Reveal>
    );
  }

  function renderStepBody() {
    switch (currentStep.id) {
      case "moderatorPin":
        return (
          <div className="space-y-3">
            <Input
              id="survey-moderator-pin"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="6-digit PIN"
              className="text-center text-lg tracking-[0.3em]"
              value={answers.moderatorPin}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                update("moderatorPin", digits);
                if (answers.surveyorId) update("surveyorId", "");
                setPinError("");
              }}
            />
            {answers.surveyorId && (
              <p className="text-sm text-accent">PIN verified ✓</p>
            )}
            {pinError && <p className="text-sm text-red-400">{pinError}</p>}
          </div>
        );
      case "isStudent":
        return (
          <RadioGroup
            name="isStudent"
            columns={2}
            value={answers.isStudent}
            onChange={(v) => update("isStudent", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "needsExtraIncome":
        return (
          <RadioGroup
            name="needsExtraIncome"
            columns={2}
            value={answers.needsExtraIncome}
            onChange={(v) => update("needsExtraIncome", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "wantsSideHustle":
        return (
          <RadioGroup
            name="wantsSideHustle"
            columns={2}
            value={answers.wantsSideHustle}
            onChange={(v) => update("wantsSideHustle", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "needsTaskHelp":
        return (
          <RadioGroup
            name="needsTaskHelp"
            columns={2}
            value={answers.needsTaskHelp}
            onChange={(v) => update("needsTaskHelp", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "taskHelpTypes":
        return (
          <CheckboxGroup
            value={answers.taskHelpTypes}
            onChange={(v) => update("taskHelpTypes", v)}
            options={hustleTaskOptions}
            otherValue={answers.taskHelpOther}
            onOtherChange={(v) => update("taskHelpOther", v)}
            otherPlaceholder="Other task (optional)"
          />
        );
      case "hustleFrequency":
        return (
          <RadioGroup
            name="hustleFrequency"
            value={answers.hustleFrequency}
            onChange={(v) => update("hustleFrequency", v)}
            options={[
              { value: "daily", label: "Daily" },
              { value: "few_times_week", label: "A few times a week" },
              { value: "weekly", label: "Weekly" },
              { value: "few_times_month", label: "A few times a month" },
              { value: "occasionally", label: "Occasionally, when available" },
            ]}
          />
        );
      case "hoursPerDay":
        return (
          <HoursPerDaySlider
            value={answers.hoursPerDay}
            touched={answers.hoursPerDayTouched}
            onChange={(v) => {
              update("hoursPerDay", v);
              update("hoursPerDayTouched", true);
            }}
          />
        );
      case "hasSkill":
        return (
          <RadioGroup
            name="hasSkill"
            columns={2}
            value={answers.hasSkill}
            onChange={(v) => update("hasSkill", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "skills":
        return (
          <CheckboxGroup
            value={answers.skills}
            onChange={(v) => update("skills", v)}
            options={skillOptions}
            otherValue={answers.skillsOther}
            onOtherChange={(v) => update("skillsOther", v)}
            otherPlaceholder="Other skill (optional)"
          />
        );
      case "willingDifferentHustle":
        return (
          <RadioGroup
            name="willingDifferentHustle"
            columns={2}
            value={answers.willingDifferentHustle}
            onChange={(v) => update("willingDifferentHustle", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "hustleCapability":
        return (
          <HustleCapabilityGrid
            value={answers.hustleCapability}
            onChange={(key, val) =>
              update("hustleCapability", { ...answers.hustleCapability, [key]: val })
            }
          />
        );
      case "wouldUseApp":
        return (
          <RadioGroup
            name="wouldUseApp"
            columns={3}
            value={answers.wouldUseApp}
            onChange={(v) => update("wouldUseApp", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "maybe", label: "Maybe" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "embarrassedWithMate":
        return (
          <RadioGroup
            name="embarrassedWithMate"
            columns={3}
            value={answers.embarrassedWithMate}
            onChange={(v) => update("embarrassedWithMate", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "depends", label: "Depends on the task" },
            ]}
          />
        );
      case "appUsageRole":
        return (
          <RadioGroup
            name="appUsageRole"
            value={answers.appUsageRole}
            onChange={(v) => update("appUsageRole", v)}
            options={[
              {
                value: "providing_hustles",
                label: "Providing Hustles — finding people to help me with task(s)",
              },
              {
                value: "hustling_the_hustles",
                label: "Hustling the Hustles — offering my services to earn money",
              },
              { value: "both", label: "Both" },
            ]}
          />
        );
      case "uninstallReasons":
        return (
          <CheckboxGroup
            value={answers.uninstallReasons}
            onChange={(v) => update("uninstallReasons", v)}
            options={uninstallOptions}
            otherValue={answers.uninstallOther}
            onOtherChange={(v) => update("uninstallOther", v)}
            otherPlaceholder="Other reason (optional)"
          />
        );
      case "concerns":
        return (
          <CheckboxGroup
            value={answers.concerns}
            onChange={(v) => update("concerns", v)}
            options={concernOptions}
            otherValue={answers.concernsOther}
            onOtherChange={(v) => update("concernsOther", v)}
            otherPlaceholder="Other concern (optional)"
          />
        );
      case "trustFactors":
        return (
          <CheckboxGroup
            value={answers.trustFactors}
            onChange={(v) => update("trustFactors", v)}
            options={trustFactorOptions}
            otherValue={answers.trustFactorsOther}
            onOtherChange={(v) => update("trustFactorsOther", v)}
            otherPlaceholder="Other factor (optional)"
          />
        );
      case "paymentPreference":
        return (
          <RadioGroup
            name="paymentPreference"
            value={answers.paymentPreference}
            onChange={(v) => update("paymentPreference", v)}
            options={[
              {
                value: "direct_with_client",
                label: "Directly with the client (online transfer or in-person cash)",
              },
              {
                value: "sydhustle_dashboard",
                label: "Through the sydHustle in-app dashboard, with buyer protection",
              },
              { value: "no_preference", label: "No preference — either works for me" },
            ]}
          />
        );
      case "commissionWillingness":
        return (
          <RadioGroup
            name="commissionWillingness"
            columns={3}
            value={answers.commissionWillingness}
            onChange={(v) => update("commissionWillingness", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "maybe", label: "Maybe, depending on the service" },
            ]}
          />
        );
      case "email":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey-email">Email *</Label>
              <Input
                id="survey-email"
                type="email"
                placeholder="you@university.edu"
                value={answers.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmailSendError("");
                  setAnswers((prev) => ({
                    ...prev,
                    email: value,
                    // Editing the email after verifying (or after a code was
                    // already sent) invalidates that verification.
                    emailVerified: false,
                    emailCodeSentFor: "",
                    verificationCode: "",
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-name">Name *</Label>
              <Input
                id="survey-name"
                type="text"
                placeholder="Your full name"
                value={answers.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-school">School / University *</Label>
              <Input
                id="survey-school"
                type="text"
                placeholder="e.g. University of Sydney"
                value={answers.school}
                onChange={(e) => update("school", e.target.value)}
                required
              />
            </div>
            {emailSendError && (
              <p className="text-sm text-red-400">{emailSendError}</p>
            )}
          </div>
        );
      case "verifyEmail":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="text-foreground">{answers.email}</span>.
            </p>
            <Input
              id="survey-verification-code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="6-digit code"
              className="text-center text-lg tracking-[0.3em]"
              value={answers.verificationCode}
              onChange={(e) =>
                update(
                  "verificationCode",
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
            />
            {codeVerifyError && (
              <p className="text-sm text-red-400">{codeVerifyError}</p>
            )}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={emailSending}
              className="text-sm text-accent hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {emailSending ? "Sending..." : "Resend code"}
            </button>
          </div>
        );
      case "additionalFeedback":
        return (
          <Textarea
            placeholder="Optional — share anything on your mind"
            rows={5}
            value={answers.additionalFeedback}
            onChange={(e) => update("additionalFeedback", e.target.value)}
          />
        );
      case "joinMarketingTeam":
        return (
          <RadioGroup
            name="joinMarketingTeam"
            columns={2}
            value={answers.joinMarketingTeam}
            onChange={(v) => update("joinMarketingTeam", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        );
      case "marketingWhatsapp":
        return (
          <div className="space-y-2">
            <Label htmlFor="survey-whatsapp">WhatsApp number</Label>
            <Input
              id="survey-whatsapp"
              type="tel"
              placeholder="e.g. +234 801 234 5678"
              value={answers.marketingWhatsapp}
              onChange={(e) => update("marketingWhatsapp", e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Reveal className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">sydHustle Student Survey</CardTitle>
          <CardDescription>
            A few minutes of your time helps us understand whether you&apos;d
            hustle, need a hustle, or both — and how useful sydHustle would
            be to you.
          </CardDescription>

          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Question {currentIndex + 1} of {visibleSteps.length}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="min-h-[16rem]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                  {currentStep.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep.description}
                    </p>
                  )}
                </div>
                <div>{renderStepBody()}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {!canProceed && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-amber-400"
            >
              Please answer this question to continue.
            </motion.p>
          )}

          {state.message && !state.success && isLastStep && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400"
            >
              {state.message}
            </motion.p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isFirstStep}
            >
              Back
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? "Submitting..." : "Submit survey"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || pinChecking || emailSending || codeVerifying}
              >
                {currentStep.id === "moderatorPin" && pinChecking
                  ? "Verifying..."
                  : currentStep.id === "email" && emailSending
                    ? "Sending code..."
                    : currentStep.id === "verifyEmail" && codeVerifying
                      ? "Verifying..."
                      : "Next"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Reveal>
  );
}
