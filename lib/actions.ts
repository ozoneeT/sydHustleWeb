"use server";

/**
 * The waitlist signup.
 *
 * This file used to hold the student survey's submission too — a few
 * hundred lines of branch logic, a schema per track, and the marketing
 * opt-in asked on its thank-you screen. Field collection finished, the
 * page came down, and all of it went with the page: a server action is a
 * POST endpoint whether or not a form still points at it, and one that
 * writes survey rows with no survey left is an open door with nothing
 * behind it.
 *
 * The responses already collected are untouched and still read by the
 * console's Survey list tab.
 */

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasValidMxRecord } from "@/lib/email/mx";
import { isEmailVerified } from "@/lib/email/verification";

const INVALID_EMAIL_DOMAIN_MESSAGE =
  "This email address looks invalid — please check for typos.";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().trim().max(100).optional(),
  school: z.string().trim().max(150).optional(),
  source: z.enum(["landing", "survey"]).default("landing"),
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
