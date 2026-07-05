"use server";

import {
  createAndSendVerificationCode,
  verifyCode,
  type SendCodeResult,
  type VerifyCodeResult,
} from "@/lib/email/verification";

export async function sendEmailVerificationCode(
  email: string
): Promise<SendCodeResult> {
  return createAndSendVerificationCode(email);
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<VerifyCodeResult> {
  return verifyCode(email, code);
}
