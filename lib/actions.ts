"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().trim().max(100).optional(),
  school: z.string().trim().max(150).optional(),
  source: z.enum(["landing", "survey"]).default("landing"),
});

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val))
  .pipe(z.string().email("Please enter a valid email address.").optional());

const hustleCapabilityValue = z.enum(["can_do", "cannot_do"]);

const surveySchema = z
  .object({
    isStudent: z.enum(["yes", "no"]),
    needsExtraIncome: z.enum(["yes", "no"]),

    wantsSideHustle: z.enum(["yes", "no"]).optional(),
    hustleFrequency: z
      .enum(["daily", "few_times_week", "weekly", "few_times_month", "occasionally"])
      .optional(),
    hoursPerDay: z.coerce.number().int().min(0).max(24).optional(),
    hasSkill: z.enum(["yes", "no"]).optional(),
    skills: z.array(z.string()).default([]),
    skillsOther: z.string().trim().max(200).optional(),
    willingDifferentHustle: z.enum(["yes", "no"]).optional(),
    hustleCapability: z.record(z.string(), hustleCapabilityValue).default({}),

    needsTaskHelp: z.enum(["yes", "no"]).optional(),
    taskHelpTypes: z.array(z.string()).default([]),
    taskHelpOther: z.string().trim().max(200).optional(),

    wouldUseApp: z.enum(["yes", "maybe", "no"]),
    embarrassedWithMate: z.enum(["yes", "no", "depends"]),
    appUsageRole: z.enum(["providing_hustles", "hustling_the_hustles", "both"]),
    uninstallReasons: z.array(z.string()).default([]),
    uninstallOther: z.string().trim().max(300).optional(),
    concerns: z.array(z.string()).default([]),
    concernsOther: z.string().trim().max(300).optional(),
    trustFactors: z.array(z.string()).default([]),
    trustFactorsOther: z.string().trim().max(300).optional(),
    paymentPreference: z.enum([
      "direct_with_client",
      "sydhustle_dashboard",
      "no_preference",
    ]),
    commissionWillingness: z.enum(["yes", "no", "maybe"]),

    email: optionalEmail,
    name: z.string().trim().max(100).optional(),
    school: z.string().trim().max(150).optional(),
    additionalFeedback: z.string().trim().max(1000).optional(),

    joinMarketingTeam: z.enum(["yes", "no"]),
    marketingWhatsapp: z.string().trim().max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.needsExtraIncome === "yes" && !data.wantsSideHustle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please let us know if you're looking for a side hustle.",
        path: ["wantsSideHustle"],
      });
    }

    if (data.joinMarketingTeam === "yes" && !data.marketingWhatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please share a WhatsApp number so we can reach you.",
        path: ["marketingWhatsapp"],
      });
    }

    // The task-poster gate question ("have you ever needed help?") is a
    // required stop on two natural entry paths into that track: respondents
    // who don't need extra income, and respondents who need income but
    // aren't after a side hustle. If it's reached later purely because of
    // the "which would you use the app for?" answer, it's asked but not
    // blocking — mirrored client-side in SurveyForm's getProviderGroupSteps.
    const naturalProviderEntry =
      data.needsExtraIncome === "no" ||
      (data.needsExtraIncome === "yes" && data.wantsSideHustle === "no");
    if (naturalProviderEntry && !data.needsTaskHelp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please answer whether you've ever needed task help.",
        path: ["needsTaskHelp"],
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

const HUSTLE_CAPABILITY_PREFIX = "hustleCapability_";

export async function submitSurvey(
  formData: FormData
): Promise<ActionResult> {
  const skills = formData.getAll("skills").map(String);
  const taskHelpTypes = formData.getAll("taskHelpTypes").map(String);
  const uninstallReasons = formData.getAll("uninstallReasons").map(String);
  const concerns = formData.getAll("concerns").map(String);
  const trustFactors = formData.getAll("trustFactors").map(String);
  const emailValue = String(formData.get("email") ?? "").trim();

  const hustleCapability: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(HUSTLE_CAPABILITY_PREFIX) && typeof value === "string") {
      hustleCapability[key.slice(HUSTLE_CAPABILITY_PREFIX.length)] = value;
    }
  }

  const parsed = surveySchema.safeParse({
    isStudent: formData.get("isStudent"),
    needsExtraIncome: formData.get("needsExtraIncome"),

    wantsSideHustle: formData.get("wantsSideHustle") || undefined,
    hustleFrequency: formData.get("hustleFrequency") || undefined,
    hoursPerDay: formData.get("hoursPerDay") || undefined,
    hasSkill: formData.get("hasSkill") || undefined,
    skills,
    skillsOther: formData.get("skillsOther") || undefined,
    willingDifferentHustle: formData.get("willingDifferentHustle") || undefined,
    hustleCapability,

    needsTaskHelp: formData.get("needsTaskHelp") || undefined,
    taskHelpTypes,
    taskHelpOther: formData.get("taskHelpOther") || undefined,

    wouldUseApp: formData.get("wouldUseApp"),
    embarrassedWithMate: formData.get("embarrassedWithMate"),
    appUsageRole: formData.get("appUsageRole"),
    uninstallReasons,
    uninstallOther: formData.get("uninstallOther") || undefined,
    concerns,
    concernsOther: formData.get("concernsOther") || undefined,
    trustFactors,
    trustFactorsOther: formData.get("trustFactorsOther") || undefined,
    paymentPreference: formData.get("paymentPreference"),
    commissionWillingness: formData.get("commissionWillingness"),

    email: emailValue,
    name: formData.get("name") || undefined,
    school: formData.get("school") || undefined,
    additionalFeedback: formData.get("additionalFeedback") || undefined,

    joinMarketingTeam: formData.get("joinMarketingTeam"),
    marketingWhatsapp: formData.get("marketingWhatsapp") || undefined,
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
      needs_extra_income: parsed.data.needsExtraIncome,

      wants_side_hustle: parsed.data.wantsSideHustle || null,
      hustle_frequency: parsed.data.hustleFrequency || null,
      hours_per_day: parsed.data.hoursPerDay ?? null,
      has_skill: parsed.data.hasSkill || null,
      skills: parsed.data.skills,
      skills_other: parsed.data.skillsOther || null,
      willing_different_hustle: parsed.data.willingDifferentHustle || null,
      hustle_capability: parsed.data.hustleCapability,

      needs_task_help: parsed.data.needsTaskHelp || null,
      task_help_types: parsed.data.taskHelpTypes,
      task_help_other: parsed.data.taskHelpOther || null,

      would_use_app: parsed.data.wouldUseApp,
      embarrassed_with_mate: parsed.data.embarrassedWithMate,
      app_usage_role: parsed.data.appUsageRole,
      uninstall_reasons: parsed.data.uninstallReasons,
      uninstall_other: parsed.data.uninstallOther || null,
      concerns: parsed.data.concerns,
      concerns_other: parsed.data.concernsOther || null,
      trust_factors: parsed.data.trustFactors,
      trust_factors_other: parsed.data.trustFactorsOther || null,
      payment_preference: parsed.data.paymentPreference,
      commission_willingness: parsed.data.commissionWillingness,

      email: parsed.data.email || null,
      name: parsed.data.name || null,
      school: parsed.data.school || null,
      additional_feedback: parsed.data.additionalFeedback || null,

      join_marketing_team: parsed.data.joinMarketingTeam,
      marketing_whatsapp: parsed.data.marketingWhatsapp || null,
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
          name: parsed.data.name || null,
          school: parsed.data.school || null,
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
