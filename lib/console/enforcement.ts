"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { sendEmail } from "@/lib/email/resend";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EnforcementState = { error: string | null; done: boolean; note?: string };

/**
 * Acting on a report, end to end.
 *
 * Four things have to happen and they happen in this order for a
 * reason:
 *
 *   1. `enforce_report` — takes the content down, records the action
 *      with a snapshot, and queues the in-app push.
 *   2. The auth ban — Supabase owns `banned_until`, and the Admin API
 *      is the supported way to set it. Only after (1) has succeeded,
 *      so we never lock somebody out over an action we failed to
 *      record.
 *   3. The email.
 *
 * Steps 2 and 3 are best-effort and say so. A suspension that took
 * effect in our tables but whose email bounced is a worse outcome to
 * hide than to report, so the action returns a note rather than
 * pretending everything landed.
 */
const schema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["warn", "remove", "suspend", "terminate", "reinstate"]),
  // Sent to the person verbatim, so the floor matches the RPC's.
  reason: z.string().trim().min(10).max(1000),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

type EnforceResult = {
  subject_id: string;
  action: string;
  ban_until: string | null;
  lift_ban: boolean;
  title: string;
  body: string;
};

const RPC_ERRORS: Record<string, string> = {
  reason_required: "Write a reason of at least 10 characters — they're sent it.",
  duration_required: "Choose how many days the suspension should last.",
  unknown_report: "That report no longer exists.",
  subject_gone: "The account behind this report no longer exists.",
  not_removable:
    "There's nothing to remove for a conversation — report the individual messages instead.",
  unknown_action: "That action isn't one we support.",
};

export async function enforceReport(
  _prev: EnforcementState,
  formData: FormData
): Promise<EnforcementState> {
  await requireConsole();

  const parsed = schema.safeParse({
    reportId: formData.get("reportId"),
    action: formData.get("action"),
    reason: formData.get("reason"),
    days: formData.get("days") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Write a reason of at least 10 characters — they're sent it.",
      done: false,
    };
  }

  const { reportId, action, reason, days } = parsed.data;
  const supabase = createServerSupabaseClient();

  // 1. The record, the takedown and the push.
  const { data, error } = await supabase.rpc("enforce_report", {
    p_report_id: reportId,
    p_action: action,
    p_reason: reason,
    p_duration_days: days ?? null,
  });

  if (error) {
    const code = Object.keys(RPC_ERRORS).find((key) =>
      error.message.includes(key)
    );
    return { error: code ? RPC_ERRORS[code]! : error.message, done: false };
  }

  const result = data as EnforceResult;
  const problems: string[] = [];

  // 2. The lock itself.
  if (result.ban_until || result.lift_ban) {
    try {
      const { error: banError } = await supabase.auth.admin.updateUserById(
        result.subject_id,
        {
          // Supabase takes a duration, not a timestamp. "none" lifts it.
          ban_duration: result.lift_ban
            ? "none"
            : `${hoursUntil(result.ban_until!)}h`,
        }
      );
      if (banError) problems.push(`account lock failed: ${banError.message}`);
    } catch (err) {
      problems.push(`account lock failed: ${(err as Error).message}`);
    }
  }

  // 3. The email. The push is already queued by the RPC.
  const email = await addressFor(supabase, result.subject_id);
  if (email) {
    const sent = await sendEmail({
      to: email,
      subject: result.title,
      html: enforcementEmail({
        title: result.title,
        body: result.body,
        action: result.action,
      }),
    });
    if (!sent.success) problems.push(`email not sent: ${sent.error}`);
  } else {
    problems.push("no email address on file — they only got the in-app notice");
  }

  revalidatePath("/console/reports");
  return {
    error: null,
    done: true,
    note: problems.length ? problems.join("; ") : undefined,
  };
}

async function addressFor(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  id: string
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.admin.getUserById(id);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Supabase's ban is a duration from now; the RPC returns the instant.
 * Rounded up, so a 7-day suspension is never 6 days and 23 hours. */
function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 3_600_000));
}

/**
 * The notice.
 *
 * Plain, specific and free of apology. It says what happened, why, and
 * what they can do — the three things somebody reads this email to find
 * out. No branding flourish: a moderation notice that looks like
 * marketing reads as a scam, and this is exactly the message a user
 * needs to trust is really from us.
 */
function enforcementEmail({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: string;
}): string {
  const appeal =
    action === "reinstate"
      ? ""
      : `<p style="margin:16px 0 0;color:#475569;font-size:14px;line-height:22px">
           If you think this is wrong, reply to this email and a person will
           look at it again.
         </p>`;

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0F172A">${escapeHtml(
    title
  )}</h1>
  <p style="margin:0;color:#0F172A;font-size:15px;line-height:24px">${escapeHtml(
    body
  )}</p>
  ${appeal}
  <p style="margin:24px 0 0;color:#94A3B8;font-size:12px;line-height:18px">
    This is an automated notice about your sydHustle account. Our community
    standards are at sydhustle.com/policies_center/community_standard.
  </p>
</div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Give one held escrow back to whoever paid it.
 *
 * The safe outcome when work cannot go ahead because we removed one of
 * the two people from the platform. The fee is waived inside
 * `refund_held_escrow` — charging somebody to be refunded for our own
 * enforcement decision is indefensible — and the payer is told.
 *
 * There is no matching "release to the worker" here on purpose. That is
 * a judgement about whether the work was actually done, which the
 * Appeals queue already exists to make; a second route to the same
 * decision is how two halves of a console start disagreeing about who
 * has been paid.
 */
const refundSchema = z.object({
  kind: z.enum(["hustle", "booking"]),
  sourceId: z.string().uuid(),
  note: z.string().trim().min(10).max(500),
});

export async function refundHeldEscrow(
  _prev: EnforcementState,
  formData: FormData
): Promise<EnforcementState> {
  await requireConsole();

  const parsed = refundSchema.safeParse({
    kind: formData.get("kind"),
    sourceId: formData.get("sourceId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: "Write a short note saying why — 10 characters or more.", done: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("refund_held_escrow", {
    p_kind: parsed.data.kind,
    p_source_id: parsed.data.sourceId,
    p_note: parsed.data.note,
  });

  if (error) {
    return {
      error: error.message.includes("escrow_not_held")
        ? "That payment has already been settled or refunded."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/reports");
  return { error: null, done: true };
}
