"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().trim().max(100).optional(),
  school: z.string().trim().max(150).optional(),
  source: z.enum(["landing", "survey"]).default("landing"),
});

const hustleCapabilityValue = z.enum(["can_do", "cannot_do"]);

type SurveyBranchData = {
  needsExtraIncome: "yes" | "no";
  wantsSideHustle?: "yes" | "no";
  hasSkill?: "yes" | "no";
  willingDifferentHustle?: "yes" | "no";
  needsTaskHelp?: "yes" | "no";
  appUsageRole: "providing_hustles" | "hustling_the_hustles" | "both";
};

function showsHustlerTrack(data: SurveyBranchData) {
  return (
    (data.needsExtraIncome === "yes" && data.wantsSideHustle === "yes") ||
    data.appUsageRole === "hustling_the_hustles" ||
    data.appUsageRole === "both"
  );
}

function showsProviderTrack(data: SurveyBranchData) {
  return (
    data.needsExtraIncome === "no" ||
    (data.needsExtraIncome === "yes" && data.wantsSideHustle === "no") ||
    data.appUsageRole === "providing_hustles" ||
    data.appUsageRole === "both"
  );
}

function showsHustleCapabilityStep(data: SurveyBranchData) {
  return (
    showsHustlerTrack(data) &&
    (data.hasSkill === "no" ||
      (data.hasSkill === "yes" && data.willingDifferentHustle === "yes"))
  );
}

function hasAtLeastOneSelection(values: string[], other?: string) {
  return values.length > 0 || Boolean(other?.trim());
}

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

    email: z.string().trim().email("Please enter a valid email address."),
    name: z.string().trim().min(1, "Please enter your name.").max(100),
    school: z
      .string()
      .trim()
      .min(1, "Please enter your school or university.")
      .max(150),
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

    if (!hasAtLeastOneSelection(data.uninstallReasons, data.uninstallOther)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one uninstall reason.",
        path: ["uninstallReasons"],
      });
    }

    if (!hasAtLeastOneSelection(data.concerns, data.concernsOther)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one concern.",
        path: ["concerns"],
      });
    }

    if (!hasAtLeastOneSelection(data.trustFactors, data.trustFactorsOther)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one trust factor.",
        path: ["trustFactors"],
      });
    }

    if (showsHustlerTrack(data)) {
      if (!data.hustleFrequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please tell us how often you'd offer your hustle.",
          path: ["hustleFrequency"],
        });
      }

      if (data.hoursPerDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please tell us how many hours per day you can spend hustling.",
          path: ["hoursPerDay"],
        });
      }

      if (!data.hasSkill) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please answer whether you have a skill to offer.",
          path: ["hasSkill"],
        });
      }

      if (data.hasSkill === "yes") {
        if (!hasAtLeastOneSelection(data.skills, data.skillsOther)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select at least one skill.",
            path: ["skills"],
          });
        }

        if (!data.willingDifferentHustle) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please answer whether you'd take on a different hustle.",
            path: ["willingDifferentHustle"],
          });
        }
      }

      if (
        showsHustleCapabilityStep(data) &&
        Object.keys(data.hustleCapability).length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please mark at least one hustle as Can do or Can't do.",
          path: ["hustleCapability"],
        });
      }
    }

    if (showsProviderTrack(data)) {
      if (!data.needsTaskHelp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please answer whether you've ever needed task help.",
          path: ["needsTaskHelp"],
        });
      }

      if (
        data.needsTaskHelp === "yes" &&
        !hasAtLeastOneSelection(data.taskHelpTypes, data.taskHelpOther)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select at least one task type.",
          path: ["taskHelpTypes"],
        });
      }
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
    name: formData.get("name"),
    school: formData.get("school"),
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

      email: parsed.data.email,
      name: parsed.data.name,
      school: parsed.data.school,
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
          name: parsed.data.name,
          school: parsed.data.school,
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
