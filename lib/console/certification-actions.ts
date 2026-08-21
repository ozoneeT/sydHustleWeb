"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { sendEmail } from "@/lib/email/resend";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Deciding a skill certification.
 *
 * Three outcomes and they are deliberately not symmetrical:
 *
 *  - **Ask for more** is a message plus a status. The message IS the request
 *    - it is what the Hustler reads in the app and what the email quotes -
 *    so it is required and it is written in full sentences by whoever is
 *    reviewing. No canned reasons: "send a clearer photo of the same licence"
 *    and "your licence has expired" are not the same request and a dropdown
 *    would flatten them.
 *  - **Certify** needs nothing typed. The mark speaks for itself.
 *  - **Reject** requires an internal note but sends the Hustler a message
 *    too, because a refusal with no reason generates a support thread
 *    whatever we do - better it arrives with the refusal.
 *
 * Every one of them emails. The app's standing banner is what actually gets
 * these seen (a push is one moment), but the email is what reaches somebody
 * who has not opened the app in a week, which is precisely the person whose
 * certification is stuck.
 */

const askSchema = z.object({
  skillId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(15, "Say what you need, in a sentence they can act on.")
    .max(4000),
});

const decideSchema = z.object({
  skillId: z.string().uuid(),
  note: z.string().trim().max(4000),
});

export type CertificationActionState = {
  error: string | null;
  done: string | null;
};

/**
 * What the reviewer is told.
 *
 * `sendEmail` reports a failure by returning rather than throwing, and
 * this file used to drop that on the floor: a missing RESEND_API_KEY on
 * the deploy meant every certification email vanished in silence while
 * the console said "Certified." and the queue emptied. The decision has
 * still been made and the row is still written - the push and the
 * in-app banner do not depend on Resend - so this is a warning on the
 * end of a success, not an error.
 */
function outcome(done: string, mailed: boolean): CertificationActionState {
  return {
    error: null,
    done: mailed ? done : `${done} The email could not be sent.`,
  };
}

async function operator(): Promise<string> {
  return process.env.CONSOLE_EMAIL ?? "console";
}

/** The Hustler's email and the Skill's name, for the notice. */
async function recipient(skillId: string) {
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from("skill_certifications")
    .select("hustler_id, hustler_skills!inner ( display_name, skill_name )")
    .eq("skill_id", skillId)
    .single();

  if (!data) return null;

  const skill = data.hustler_skills as unknown as {
    display_name: string;
    skill_name: string;
  };
  const { data: account } = await supabase.auth.admin.getUserById(
    data.hustler_id as string,
  );

  return {
    email: account?.user?.email ?? null,
    displayName: skill.display_name,
    skillName: skill.skill_name,
  };
}

function shell(heading: string, body: string, footer?: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0B1220">
  <p style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0F9D8F;margin:0 0 6px">sydHustle</p>
  <h1 style="font-size:20px;margin:0 0 14px">${heading}</h1>
  ${body}
  <p style="font-size:13px;line-height:20px;color:#6B7280;margin:22px 0 0">${
    footer ??
    "Open the sydHustle app to continue. You will see this on your home screen too."
  }</p>
</div>`;
}

/**
 * The certified mark, drawn in the email rather than described.
 *
 * The one message in this file that is good news, and a wall of
 * paragraphs is how good news gets skimmed past. An image would be
 * better still, but a remote image in an email is blocked by default in
 * most clients, so this is built from characters and a border - nothing
 * to load, nothing to allow, identical in every reader.
 */
function mark(): string {
  return `<div style="margin:0 0 16px;padding:16px;border:1px solid #0F9D8F;border-radius:12px;background:#F6FBFA;text-align:center">
  <div style="font-size:26px;line-height:1">\u2713</div>
  <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0F9D8F;margin-top:6px">Certified by sydHustle</div>
</div>`;
}

function quote(text: string): string {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<blockquote style="margin:0 0 16px;padding:12px 14px;border-left:3px solid #0F9D8F;background:#F6FBFA;font-size:14px;line-height:21px;white-space:pre-wrap">${safe}</blockquote>`;
}

export async function requestCertificationInfo(
  _previous: CertificationActionState,
  formData: FormData,
): Promise<CertificationActionState> {
  await requireConsole();

  const parsed = askSchema.safeParse({
    skillId: formData.get("skillId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the request.", done: null };
  }

  const supabase = createServerSupabaseClient();
  const { skillId, body } = parsed.data;

  // The message first: if the status flipped first and this failed, the
  // Hustler would be told something was needed with nothing saying what.
  const { error: messageError } = await supabase
    .from("skill_certification_messages")
    .insert({ skill_id: skillId, author_role: "admin", body });

  if (messageError) {
    console.error("[console] certification message failed", messageError);
    return { error: messageError.message, done: null };
  }

  const { error: statusError } = await supabase
    .from("skill_certifications")
    .update({ status: "needs_info", updated_at: new Date().toISOString() })
    .eq("skill_id", skillId);

  if (statusError) {
    console.error("[console] certification status failed", statusError);
    return { error: statusError.message, done: null };
  }

  const to = await recipient(skillId);
  let mailed = true;
  if (to?.email) {
    mailed = (await sendEmail({
      to: to.email,
      subject: `Your Skill needs one more thing - ${to.displayName}`,
      html: shell(
        "We need a bit more to certify your Skill",
        `<p style="font-size:15px;line-height:23px;margin:0 0 14px">We looked at <strong>${to.displayName}</strong> (${to.skillName}) and need this before we can certify it:</p>
         ${quote(body)}
         <p style="font-size:15px;line-height:23px;margin:0">Open the app and you will find it under <strong>Your attention is needed</strong> on the home screen.</p>`,
      ),
    })).success;
  }

  revalidatePath("/console/certifications");
  return outcome("Request sent.", mailed);
}

export async function certifySkill(
  _previous: CertificationActionState,
  formData: FormData,
): Promise<CertificationActionState> {
  await requireConsole();

  const parsed = decideSchema.safeParse({
    skillId: formData.get("skillId"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the form.", done: null };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("skill_certifications")
    .update({
      status: "certified",
      decided_at: new Date().toISOString(),
      decided_by: await operator(),
      reviewer_note: parsed.data.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("skill_id", parsed.data.skillId);

  if (error) {
    console.error("[console] certify failed", error);
    return { error: error.message, done: null };
  }

  const to = await recipient(parsed.data.skillId);
  let mailed = true;
  if (to?.email) {
    mailed = (await sendEmail({
      to: to.email,
      subject: `Congratulations! ${to.displayName} is certified`,
      html: shell(
        "Congratulations, your Skill is certified",
        `<p style="font-size:15px;line-height:23px;margin:0 0 14px">We have looked at everything you sent for <strong>${to.displayName}</strong> (${to.skillName}), and it checks out. Your Skill now carries the sydHustle certified mark.</p>
         ${mark()}
         <p style="font-size:15px;line-height:23px;margin:0 0 14px">Clients browsing ${to.skillName}s will see it on your card. It is the clearest signal on this platform that somebody has proved they can do the work, and only a small number of Skills carry it.</p>
         <p style="font-size:15px;line-height:23px;margin:0">Nothing else to do. Thank you for taking the trouble to send your documents.</p>`,
        "Keep your certificate current - we may ask again when it is due to expire.",
      ),
    })).success;
  }

  revalidatePath("/console/certifications");
  return outcome("Certified.", mailed);
}

export async function rejectCertification(
  _previous: CertificationActionState,
  formData: FormData,
): Promise<CertificationActionState> {
  await requireConsole();

  const parsed = askSchema.safeParse({
    skillId: formData.get("skillId"),
    // Reuses the ask schema: a rejection has to say why, in the same words
    // the Hustler will read.
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Say why, in a sentence they can act on.",
      done: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { skillId, body } = parsed.data;

  const { error: messageError } = await supabase
    .from("skill_certification_messages")
    .insert({ skill_id: skillId, author_role: "admin", body });

  if (messageError) {
    return { error: messageError.message, done: null };
  }

  const { error } = await supabase
    .from("skill_certifications")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: await operator(),
      reviewer_note: body,
      updated_at: new Date().toISOString(),
    })
    .eq("skill_id", skillId);

  if (error) {
    console.error("[console] reject failed", error);
    return { error: error.message, done: null };
  }

  const to = await recipient(skillId);
  let mailed = true;
  if (to?.email) {
    mailed = (await sendEmail({
      to: to.email,
      subject: `We could not certify ${to.displayName}`,
      html: shell(
        "We could not certify this Skill",
        `<p style="font-size:15px;line-height:23px;margin:0 0 14px">We reviewed <strong>${to.displayName}</strong> (${to.skillName}) and cannot certify it as things stand:</p>
         ${quote(body)}
         <p style="font-size:15px;line-height:23px;margin:0">Your Skill is still listed and you can still be booked. If you can put this right, send the documents again from the app and we will look again.</p>`,
      ),
    })).success;
  }

  revalidatePath("/console/certifications");
  return outcome("Rejected.", mailed);
}
