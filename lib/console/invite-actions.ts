"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { checkPasswordStrength, hashPassword } from "@/lib/console/password";
import { createConsoleSession } from "@/lib/console/session";
import { findInvite, getStaff, markInviteAccepted } from "@/lib/console/staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Accepting an invitation.
 *
 * Kept out of lib/console/staff-actions.ts on purpose: everything there is
 * gated on being the superadmin, and this one has to be reachable by
 * someone with no session at all. The invitation token is the whole
 * credential, so it is re-verified here rather than trusted from the page
 * that rendered the form.
 */

export type AcceptState = { error: string | null };

const schema = z
  .object({
    token: z.string().trim().min(10),
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Those two passwords don't match.",
    path: ["confirm"],
  });

export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData
): Promise<AcceptState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const weak = checkPasswordStrength(parsed.data.password);
  if (weak) return { error: weak };

  const invite = await findInvite(parsed.data.token);
  if (!invite) {
    return {
      error: "This invitation has expired or already been used. Ask for a new one.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("console_staff")
    .update({
      password_hash: await hashPassword(parsed.data.password),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invite.staff.id)
    // Only an invited account may be activated this way. A suspended one
    // must not be able to let itself back in with an old invitation link.
    .eq("status", "invited");

  if (error) {
    console.error("failed to accept an invitation:", error);
    return { error: "Something went wrong. Please try again." };
  }

  await markInviteAccepted(invite.invitationId);

  // Signed straight in — asking someone to type the password they just chose
  // into a login form on the very next screen is friction with no security to
  // show for it.
  const staff = await getStaff(invite.staff.id);
  if (staff?.status === "active") {
    await createConsoleSession({
      staffId: staff.id,
      permissions: staff.permissions,
    });
    redirect(
      staff.permissions[0] ? `/console/${staff.permissions[0]}` : "/console/denied"
    );
  }

  redirect("/console");
}
