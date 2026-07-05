"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().trim().max(100).optional(),
  school: z.string().trim().max(150).optional(),
  source: z.enum(["landing", "survey"]).default("landing"),
});

const surveySchema = z.object({
  isStudent: z.enum([
    "university",
    "college",
    "high_school",
    "not_student",
  ]),
  hasSideHustle: z.enum(["yes", "no", "before"]),
  hustleTypes: z.array(z.string()).default([]),
  hustleOther: z.string().trim().max(200).optional(),
  hoursPerWeek: z
    .enum(["0", "1-5", "6-10", "10+"])
    .optional()
    .nullable(),
  challenges: z.array(z.string()).default([]),
  challengeOther: z.string().trim().max(200).optional(),
  desiredFeatures: z
    .array(z.string())
    .min(1, "Select at least one feature."),
  interestScore: z.coerce.number().int().min(1).max(5),
  wouldUse: z.enum([
    "definitely",
    "probably",
    "maybe",
    "probably_not",
    "definitely_not",
  ]),
  wouldPay: z.enum(["yes", "maybe", "no"]),
  trustFactors: z.string().trim().max(500).optional(),
  email: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().email("Please enter a valid email address.").optional()),
  additionalFeedback: z.string().trim().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.challenges.length === 0 && !data.challengeOther) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select at least one challenge.",
      path: ["challenges"],
    });
  }
});

export type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitWaitlist(
  formData: FormData
): Promise<ActionResult> {
  const parsed = waitlistSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    school: formData.get("school") || undefined,
    source: formData.get("source") || "landing",
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    return {
      success: false,
      message: firstError ?? "Invalid form data.",
      fieldErrors,
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("waitlist").insert({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || null,
      school: parsed.data.school || null,
      source: parsed.data.source,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: "You're already on the waitlist. Thanks for your interest!",
        };
      }
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    return {
      success: true,
      message: "You're on the list! We'll be in touch when sydHustle launches.",
    };
  } catch {
    return {
      success: false,
      message: "Server configuration error. Please try again later.",
    };
  }
}

export async function submitSurvey(
  formData: FormData
): Promise<ActionResult> {
  const hustleTypes = formData.getAll("hustleTypes").map(String);
  const challenges = formData.getAll("challenges").map(String);
  const desiredFeatures = formData.getAll("desiredFeatures").map(String);
  const emailValue = String(formData.get("email") ?? "").trim();

  const parsed = surveySchema.safeParse({
    isStudent: formData.get("isStudent"),
    hasSideHustle: formData.get("hasSideHustle"),
    hustleTypes,
    hustleOther: formData.get("hustleOther") || undefined,
    hoursPerWeek: formData.get("hoursPerWeek") || null,
    challenges,
    challengeOther: formData.get("challengeOther") || undefined,
    desiredFeatures,
    interestScore: formData.get("interestScore"),
    wouldUse: formData.get("wouldUse"),
    wouldPay: formData.get("wouldPay"),
    trustFactors: formData.get("trustFactors") || undefined,
    email: emailValue,
    additionalFeedback: formData.get("additionalFeedback") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    return {
      success: false,
      message: firstError ?? "Please complete all required fields.",
      fieldErrors,
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("survey_responses").insert({
      is_student: parsed.data.isStudent,
      has_side_hustle: parsed.data.hasSideHustle,
      hustle_types: parsed.data.hustleTypes,
      hustle_other: parsed.data.hustleOther || null,
      hours_per_week: parsed.data.hoursPerWeek || null,
      challenges: parsed.data.challenges,
      challenge_other: parsed.data.challengeOther || null,
      desired_features: parsed.data.desiredFeatures,
      interest_score: parsed.data.interestScore,
      would_use: parsed.data.wouldUse,
      would_pay: parsed.data.wouldPay,
      trust_factors: parsed.data.trustFactors || null,
      email: parsed.data.email || null,
      additional_feedback: parsed.data.additionalFeedback || null,
    });

    if (error) {
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    if (parsed.data.email) {
      await supabase.from("waitlist").upsert(
        {
          email: parsed.data.email.toLowerCase(),
          source: "survey",
        },
        { onConflict: "email", ignoreDuplicates: true }
      );
    }

    return {
      success: true,
      message: "Thank you! Your response helps shape sydHustle.",
    };
  } catch {
    return {
      success: false,
      message: "Server configuration error. Please try again later.",
    };
  }
}
