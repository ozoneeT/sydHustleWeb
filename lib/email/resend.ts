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
  text,
}: {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text alternative. Worth setting on anything that isn't
   * a one-line code: a multipart message lands better than HTML alone. */
  text?: string;
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
      body: JSON.stringify({ from, to: [to], subject, html, ...(text ? { text } : {}) }),
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

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

/** Resend's own ceiling for one batch call. */
export const BATCH_LIMIT = 100;

export interface BatchEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export type BatchOutcome =
  | { ok: true; ids: string[] }
  | { ok: false; error: string; retryable: boolean };

/**
 * Sends up to 100 separate emails in one API call.
 *
 * Separate is the important word: this is not one message with 100
 * recipients, so nobody sees anyone else's address and each message can
 * carry its own greeting and its own unsubscribe link. Resend returns the
 * ids in request order, which is what lets the caller match a result back
 * to a row.
 *
 * The team-wide rate limit is 10 requests/second, so at 100 emails a call
 * a campaign is nowhere near it — but a 429 is still reported as retryable
 * rather than swallowed, because the alternative is a batch of people who
 * silently never got the email.
 */
export async function sendBatchEmails(
  emails: BatchEmail[],
  options: { from?: string; replyTo?: string } = {}
): Promise<BatchOutcome> {
  if (emails.length === 0) return { ok: true, ids: [] };
  if (emails.length > BATCH_LIMIT) {
    return {
      ok: false,
      error: `A batch can hold at most ${BATCH_LIMIT} emails.`,
      retryable: false,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    options.from ?? process.env.EMAIL_MARKETING_FROM ?? process.env.EMAIL_FROM;
  const replyTo = options.replyTo ?? process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email sending is not configured (RESEND_API_KEY / EMAIL_FROM).",
      retryable: false,
    };
  }

  const payload = emails.map((email) => ({
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(email.headers ? { headers: email.headers } : {}),
    ...(email.tags ? { tags: email.tags } : {}),
  }));

  let res: Response;
  try {
    res = await fetch(RESEND_BATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("failed to reach the Resend batch API:", err);
    return { ok: false, error: "Couldn't reach Resend.", retryable: true };
  }

  const raw = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("Resend batch error:", res.status, raw);
    let message = `Resend returned ${res.status}.`;
    try {
      const parsed = JSON.parse(raw) as { message?: string; name?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // Keep the status-code message.
    }
    // 429 is pacing and 5xx is theirs; both are worth another go. A 4xx
    // about the payload will fail identically forever, so say so.
    return { ok: false, error: message, retryable: res.status === 429 || res.status >= 500 };
  }

  try {
    const parsed = JSON.parse(raw) as { data?: { id: string }[] };
    return { ok: true, ids: (parsed.data ?? []).map((item) => item.id) };
  } catch {
    // Accepted but unreadable: the mail is gone, so treat it as sent
    // rather than risk sending it twice on a retry.
    console.error("Resend batch returned an unreadable body:", raw);
    return { ok: true, ids: [] };
  }
}
