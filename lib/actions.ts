"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { allHustlesRated } from "@/lib/hustle-tasks";
import { broadcastNewResponse } from "@/lib/moderator/realtime";
import { hasValidMxRecord } from "@/lib/email/mx";
import { isEmailVerified } from "@/lib/email/verification";

const INVALID_EMAIL_DOMAIN_MESSAGE =
  "This email address looks invalid — please check for typos.";

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    hoursPerDayTouched: z.enum(["true"]).optional(),
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

    additionalFeedback: z.string().trim().max(1000).optional(),

    joinWaitlist: z.enum(["yes", "no"]),
    email: z.string().trim().optional(),
    name: z.string().trim().max(100).optional(),
    school: z.string().trim().max(150).optional(),

    surveyorId: z.string().uuid("Please enter a valid moderator PIN before continuing."),
  })
  .superRefine((data, ctx) => {
    if (data.needsExtraIncome === "yes" && !data.wantsSideHustle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please let us know if you're looking for a side hustle.",
        path: ["wantsSideHustle"],
      });
    }

    if (data.joinWaitlist === "yes") {
      if (!data.email || !EMAIL_FORMAT_RE.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid email address.",
          path: ["email"],
        });
      }
      if (!data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your name.",
          path: ["name"],
        });
      }
      if (!data.school) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your school or university.",
          path: ["school"],
        });
      }
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

      if (data.hoursPerDayTouched !== "true") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please drag the slider to set your hours per day.",
          path: ["hoursPerDay"],
        });
      } else if (data.hoursPerDay === undefined) {
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
        !allHustlesRated(data.hustleCapability)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please mark every hustle as Can do or Can't do.",
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
  | { success: true; message: string; responseId?: string }
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

  if (!(await hasValidMxRecord(parsed.data.email))) {
    return {
      success: false,
      message: INVALID_EMAIL_DOMAIN_MESSAGE,
      fieldErrors: { email: [INVALID_EMAIL_DOMAIN_MESSAGE] },
    };
  }

  if (!(await isEmailVerified(parsed.data.email))) {
    return {
      success: false,
      message: "Please verify your email before joining the waitlist.",
      fieldErrors: {
        email: ["Please verify your email before joining the waitlist."],
      },
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

function formatSurveyInsertError(error: { code?: string; message?: string }) {
  console.error("survey_responses insert failed:", error);

  // PGRST204 means the column genuinely exists in Postgres but PostgREST's
  // cached schema hasn't picked it up yet — happens right after running an
  // ALTER TABLE migration until the schema cache is reloaded (Supabase
  // dashboard: Project Settings -> API -> Reload schema, or run
  // `NOTIFY pgrst, 'reload schema';` in the SQL editor).
  if (error.code === "PGRST204" || error.message?.includes("schema cache")) {
    return "We couldn't save your survey — please try again in a moment while we finish updating the database.";
  }

  if (error.code === "23503") {
    return "Your moderator PIN session expired. Please refresh and re-enter the PIN.";
  }

  return "Something went wrong. Please try again.";
}

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
    hoursPerDayTouched: formData.get("hoursPerDayTouched") || undefined,
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

    additionalFeedback: formData.get("additionalFeedback") || undefined,

    joinWaitlist: formData.get("joinWaitlist"),
    email: emailValue || undefined,
    name: formData.get("name") || undefined,
    school: formData.get("school") || undefined,

    surveyorId: formData.get("surveyorId"),
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

  const wantsWaitlist = parsed.data.joinWaitlist === "yes";

  if (wantsWaitlist) {
    if (!parsed.data.email || !(await hasValidMxRecord(parsed.data.email))) {
      return {
        success: false,
        message: INVALID_EMAIL_DOMAIN_MESSAGE,
        fieldErrors: { email: [INVALID_EMAIL_DOMAIN_MESSAGE] },
      };
    }

    // Belt-and-suspenders: the wizard already gates progress on a verified
    // email, but form data can be tampered with client-side, so re-check
    // here against the server-recorded verification before writing to the DB.
    if (!(await isEmailVerified(parsed.data.email))) {
      return {
        success: false,
        message: "Please verify your email before submitting.",
        fieldErrors: { email: ["Please verify your email before submitting."] },
      };
    }
  }

  const email = wantsWaitlist ? parsed.data.email!.toLowerCase() : null;
  const name = wantsWaitlist ? parsed.data.name! : null;
  const school = wantsWaitlist ? parsed.data.school! : null;

  try {
    const supabase = createServerSupabaseClient();
    const { data: inserted, error } = await supabase
      .from("survey_responses")
      .insert({
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

        join_waitlist: parsed.data.joinWaitlist,
        email,
        name,
        school,
        additional_feedback: parsed.data.additionalFeedback || null,

        surveyor_id: parsed.data.surveyorId,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        message: formatSurveyInsertError(error),
      };
    }

    await broadcastNewResponse(supabase, parsed.data.surveyorId);

    if (email) {
      const { error: waitlistError } = await supabase.from("waitlist").upsert(
        {
          email,
          name,
          school,
          source: "survey",
        },
        { onConflict: "email", ignoreDuplicates: true }
      );

      if (waitlistError) {
        console.error("waitlist upsert failed:", waitlistError);
      }
    }

    return {
      success: true,
      message: "Thank you! Your response helps shape sydHustle.",
      responseId: inserted.id,
    };
  } catch {
    return {
      success: false,
      message: "Server configuration error. Please try again later.",
    };
  }
}

const marketingInterestSchema = z
  .object({
    responseId: z.string().uuid(),
    joinMarketingTeam: z.enum(["yes", "no"]),
    marketingWhatsapp: z.string().trim().max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.joinMarketingTeam === "yes" && !data.marketingWhatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please share a WhatsApp number so we can reach you.",
        path: ["marketingWhatsapp"],
      });
    }
  });

/**
 * Records interest in the marketing team after the survey has already been
 * submitted (asked on the "thank you" screen rather than as a survey
 * question), by updating the previously-inserted survey_responses row.
 */
export async function submitMarketingInterest(
  formData: FormData
): Promise<ActionResult> {
  const parsed = marketingInterestSchema.safeParse({
    responseId: formData.get("responseId"),
    joinMarketingTeam: formData.get("joinMarketingTeam"),
    marketingWhatsapp: formData.get("marketingWhatsapp") || undefined,
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
    const { data, error } = await supabase
      .from("survey_responses")
      .update({
        join_marketing_team: parsed.data.joinMarketingTeam,
        marketing_whatsapp: parsed.data.marketingWhatsapp || null,
      })
      .eq("id", parsed.data.responseId)
      .select("surveyor_id")
      .single();

    if (error) {
      console.error("failed to record marketing interest:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    if (data?.surveyor_id) {
      await broadcastNewResponse(supabase, data.surveyor_id);
    }

    return {
      success: true,
      message:
        parsed.data.joinMarketingTeam === "yes"
          ? "Thanks! We'll reach out on WhatsApp closer to launch."
          : "Thanks for letting us know!",
    };
  } catch {
    return {
      success: false,
      message: "Server configuration error. Please try again later.",
    };
  }
}
