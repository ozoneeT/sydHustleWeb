import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Thin wrapper around Resend's REST API (no SDK dependency needed). Resend's
 * free tier covers 3,000 emails/month at no cost — you just need your own
 * API key. See README for setup instructions.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error(
      "Email sending is not configured: missing RESEND_API_KEY or EMAIL_FROM."
    );
    return { success: false, error: "Email sending is not configured." };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend API error:", res.status, body);
      return { success: false, error: "Failed to send email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to reach Resend API:", err);
    return { success: false, error: "Failed to send email." };
  }
}
