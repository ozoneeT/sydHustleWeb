"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateUniquePin } from "@/lib/moderator/pin";
import { createSession, deleteSession } from "@/lib/moderator/session";

export type SignupResult =
  | { success: true; name: string; pin: string }
  | { success: false; message: string };

export type LoginResult = { success: false; message: string };

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
});

export async function signUpSurveyor(
  _prev: SignupResult,
  formData: FormData
): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please enter your name.",
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const pin = await generateUniquePin(supabase);

    const { error } = await supabase.from("surveyors").insert({
      name: parsed.data.name,
      pin,
      role: "surveyor",
    });

    if (error) {
      console.error("surveyor signup failed:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }

    return { success: true, name: parsed.data.name, pin };
  } catch (err) {
    console.error("surveyor signup error:", err);
    return { success: false, message: "Server configuration error. Please try again later." };
  }
}

const loginSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN must be 6 digits."),
});

export async function loginModerator(
  _prev: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    name: formData.get("name"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  let redirectTarget: string;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("surveyors")
      .select("id, name, role")
      .eq("pin", parsed.data.pin)
      .maybeSingle();

    if (error) {
      console.error("moderator login lookup failed:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }

    const nameMatches =
      data && data.name.trim().toLowerCase() === parsed.data.name.trim().toLowerCase();

    if (!data || !nameMatches) {
      return { success: false, message: "Invalid name or PIN." };
    }

    await createSession(data.id, data.role);
    redirectTarget = data.role === "admin" ? "/admin" : "/dashboard";
  } catch (err) {
    console.error("moderator login error:", err);
    return { success: false, message: "Server configuration error. Please try again later." };
  }

  // redirect() throws internally, so it must be called outside the
  // try/catch above (otherwise it would be swallowed as an error).
  redirect(redirectTarget);
}

export async function logoutModerator() {
  await deleteSession();
  redirect("/moderator/login");
}

export type VerifyPinResult = { valid: boolean; surveyorId?: string };

export async function verifyModeratorPin(pin: string): Promise<VerifyPinResult> {
  const trimmed = pin.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("surveyors")
      .select("id")
      .eq("pin", trimmed)
      .maybeSingle();

    if (error || !data) {
      return { valid: false };
    }

    return { valid: true, surveyorId: data.id };
  } catch {
    return { valid: false };
  }
}
