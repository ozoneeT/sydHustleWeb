import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasValidMxRecord } from "@/lib/email/mx";
import { generateOtp } from "@/lib/email/otp";
import { sendEmail } from "@/lib/email/resend";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_SENDS_PER_DAY = 8;
const VERIFIED_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours — long enough to finish the survey

export interface SendCodeResult {
  success: boolean;
  message: string;
  // True when no code was actually sent because this email is already a
  // confirmed waitlist member — callers should treat the email as verified
  // immediately instead of showing a "enter the code" step.
  alreadyVerified?: boolean;
}

async function isAlreadyOnWaitlist(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("waitlist")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("failed to check waitlist membership:", error);
    return false;
  }

  return Boolean(data);
}

export async function createAndSendVerificationCode(
  rawEmail: string
): Promise<SendCodeResult> {
  const email = rawEmail.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  if (!(await hasValidMxRecord(email))) {
    return {
      success: false,
      message: "This email address looks invalid — please check for typos.",
    };
  }

  const supabase = createServerSupabaseClient();

  // Already a confirmed waitlist member — no need to make them verify (and
  // us send) another code for the same address.
  if (await isAlreadyOnWaitlist(supabase, email)) {
    return {
      success: true,
      message: "You're already on the waitlist — no need to verify again!",
      alreadyVerified: true,
    };
  }

  const { data: recent, error: recentError } = await supabase
    .from("email_verifications")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(MAX_SENDS_PER_DAY);

  if (recentError) {
    console.error("failed to check recent verification codes:", recentError);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const now = Date.now();

  if (recent && recent.length > 0) {
    const lastSentAt = new Date(recent[0].created_at).getTime();
    if (now - lastSentAt < RESEND_COOLDOWN_MS) {
      return {
        success: false,
        message: "Please wait a moment before requesting another code.",
      };
    }
  }

  const dayAgo = now - 24 * 60 * 60 * 1000;
  const sendsToday = (recent ?? []).filter(
    (r) => new Date(r.created_at).getTime() > dayAgo
  ).length;

  if (sendsToday >= MAX_SENDS_PER_DAY) {
    return {
      success: false,
      message: "Too many attempts for this email today. Please try again tomorrow.",
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();

  const { error: insertError } = await supabase.from("email_verifications").insert({
    email,
    code,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("failed to store verification code:", insertError);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { success, error } = await sendEmail({
    to: email,
    subject: `${code} is your sydHustle verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0b1120;">Verify your email for sydHustle</h2>
        <p>Enter this code to confirm your email and finish the sydHustle survey:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f766e;">${code}</p>
        <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (!success) {
    return {
      success: false,
      message: error ?? "Couldn't send the verification email. Please try again.",
    };
  }

  return { success: true, message: "Code sent! Check your inbox." };
}

export interface VerifyCodeResult {
  valid: boolean;
  message?: string;
}

export async function verifyCode(
  rawEmail: string,
  rawCode: string
): Promise<VerifyCodeResult> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();

  if (!/^\d{6}$/.test(code)) {
    return { valid: false, message: "Please enter the 6-digit code." };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_verifications")
    .select("id, code, verified, expires_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("failed to look up verification code:", error);
    return { valid: false, message: "Something went wrong. Please try again." };
  }

  if (!data) {
    return { valid: false, message: "Please request a verification code first." };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { valid: false, message: "This code has expired. Please resend it." };
  }

  if (data.code !== code) {
    return { valid: false, message: "Invalid code. Please try again." };
  }

  const { error: updateError } = await supabase
    .from("email_verifications")
    .update({ verified: true })
    .eq("id", data.id);

  if (updateError) {
    console.error("failed to mark verification code as verified:", updateError);
    return { valid: false, message: "Something went wrong. Please try again." };
  }

  return { valid: true };
}

export async function isEmailVerified(rawEmail: string): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  const supabase = createServerSupabaseClient();

  if (await isAlreadyOnWaitlist(supabase, email)) {
    return true;
  }

  const { data, error } = await supabase
    .from("email_verifications")
    .select("verified, created_at")
    .eq("email", email)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("failed to check email verification status:", error);
    return false;
  }

  if (!data) return false;

  return Date.now() - new Date(data.created_at).getTime() < VERIFIED_WINDOW_MS;
}
