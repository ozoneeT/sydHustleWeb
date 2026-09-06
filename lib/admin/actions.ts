"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/dal";
import { deleteAdminSession } from "@/lib/admin/session";
import { createInvite, getStaff, listRoles } from "@/lib/console/staff";
import { sendInviteEmail } from "@/lib/console/staff-email";
import { CONSOLE_TAB_KEYS, tabLabel, type ConsoleTab } from "@/lib/console/tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Everything the superadmin does to roles and staff.
 *
 * Every export starts with `requireAdmin()`, and that is not a formality:
 * these are server actions, reachable by a direct POST from anyone who
 * knows the action id. A staff member with a console session must not be
 * able to grant themselves the panic desk by calling this file, so the
 * /admin session — which needs the environment password — is checked here
 * rather than inherited from the page that rendered the form.
 */

export async function adminLogout() {
  await deleteAdminSession();
  redirect("/admin");
}

const tabList = z
  .array(z.string())
  .transform((values) =>
    [...new Set(values)].filter((v): v is ConsoleTab =>
      (CONSOLE_TAB_KEYS as string[]).includes(v)
    )
  );

const roleSchema = z.object({
  name: z.string().trim().min(2, "Give the role a name.").max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  permissions: tabList,
});

export type RoleState = {
  error: string | null;
  saved?: boolean;
};

function readTabs(formData: FormData): string[] {
  return formData.getAll("permissions").map((v) => String(v));
}

export async function saveRole(
  roleId: string | null,
  _prev: RoleState,
  formData: FormData
): Promise<RoleState> {
  await requireAdmin();

  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    permissions: readTabs(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = createServerSupabaseClient();
  const row = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    permissions: parsed.data.permissions,
    updated_at: new Date().toISOString(),
  };

  if (roleId) {
    const { error } = await supabase
      .from("console_roles")
      .update(row)
      .eq("id", roleId);
    if (error) {
      console.error("failed to update a role:", error);
      return {
        error:
          error.code === "23505"
            ? "There's already a role with that name."
            : "Couldn't save the role. Please try again.",
      };
    }
  } else {
    const { error } = await supabase.from("console_roles").insert(row);
    if (error) {
      console.error("failed to create a role:", error);
      return {
        error:
          error.code === "23505"
            ? "There's already a role with that name."
            : "Couldn't create the role. Please try again.",
      };
    }
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/staff");
  return { error: null, saved: true };
}

/**
 * Deleting a role takes its tabs away from everyone holding it — the join
 * rows go with it, by the foreign key's ON DELETE CASCADE. Staff aren't
 * deleted, they're just left with whatever their other roles grant, which
 * may be nothing.
 */
export async function deleteRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const roleId = String(formData.get("roleId") ?? "");
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("console_roles").delete().eq("id", roleId);
  if (error) console.error("failed to delete a role:", error);

  revalidatePath("/admin/roles");
  revalidatePath("/admin/staff");
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  roleIds: z.array(z.string().uuid()).min(1, "Pick at least one role."),
});

export type InviteState = {
  error: string | null;
  invited?: { email: string; emailed: boolean } | null;
};

/**
 * Creates the account and emails the invitation.
 *
 * The account is written first and the email sent after, so a failing
 * mailer leaves a staff member who exists but can't sign in — recoverable
 * with "Resend invite". The other order would send a working link to an
 * account that was never created.
 */
export async function inviteStaff(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    roleIds: formData.getAll("roleIds").map((v) => String(v)),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      invited: null,
    };
  }

  const supabase = createServerSupabaseClient();

  const { data: staff, error } = await supabase
    .from("console_staff")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      status: "invited",
    })
    .select("id")
    .single();

  if (error || !staff) {
    console.error("failed to create a staff member:", error);
    return {
      error:
        error?.code === "23505"
          ? "Someone with that email address has already been invited."
          : "Couldn't create that account. Please try again.",
      invited: null,
    };
  }

  const { error: rolesError } = await supabase.from("console_staff_roles").insert(
    parsed.data.roleIds.map((roleId) => ({
      staff_id: staff.id,
      role_id: roleId,
    }))
  );

  if (rolesError) {
    console.error("failed to attach roles to a new staff member:", rolesError);
    return {
      error: "The account was created but its roles weren't saved. Edit it below.",
      invited: null,
    };
  }

  const emailed = await sendInvite(staff.id);

  revalidatePath("/admin/staff");
  return { error: null, invited: { email: parsed.data.email, emailed } };
}

/** Mints a fresh token, retires any older one, and sends the email. */
async function sendInvite(staffId: string): Promise<boolean> {
  const [token, staff] = await Promise.all([createInvite(staffId), getStaff(staffId)]);
  if (!token || !staff) return false;

  const result = await sendInviteEmail({
    to: staff.email,
    name: staff.name,
    token,
    roleNames: staff.roles.map((role) => role.name),
    tabLabels: staff.permissions.map(tabLabel),
  });

  return result.success;
}

export type StaffActionState = { error: string | null; done: string | null };

export async function resendInvite(
  _prev: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  await requireAdmin();

  const staffId = String(formData.get("staffId") ?? "");
  const staff = await getStaff(staffId);
  if (!staff) return { error: "That account no longer exists.", done: null };
  if (staff.status === "active") {
    return { error: "They've already set a password.", done: null };
  }

  const sent = await sendInvite(staffId);
  revalidatePath("/admin/staff");

  return sent
    ? { error: null, done: `Invitation resent to ${staff.email}.` }
    : { error: "Couldn't send the email. Check the Resend key and try again.", done: null };
}

const rolesSchema = z.object({
  staffId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
});

export async function setStaffRoles(
  _prev: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  await requireAdmin();

  const parsed = rolesSchema.safeParse({
    staffId: formData.get("staffId"),
    roleIds: formData.getAll("roleIds").map((v) => String(v)),
  });
  if (!parsed.success) return { error: "Couldn't read that change.", done: null };

  const supabase = createServerSupabaseClient();

  // Replace rather than diff: the form always posts the complete set, and a
  // delete-then-insert can't leave a role attached that the operator just
  // unticked.
  const { error: clearError } = await supabase
    .from("console_staff_roles")
    .delete()
    .eq("staff_id", parsed.data.staffId);

  if (clearError) {
    console.error("failed to clear staff roles:", clearError);
    return { error: "Couldn't update their roles. Please try again.", done: null };
  }

  if (parsed.data.roleIds.length > 0) {
    const { error } = await supabase.from("console_staff_roles").insert(
      parsed.data.roleIds.map((roleId) => ({
        staff_id: parsed.data.staffId,
        role_id: roleId,
      }))
    );
    if (error) {
      console.error("failed to set staff roles:", error);
      return { error: "Couldn't update their roles. Please try again.", done: null };
    }
  }

  revalidatePath("/admin/staff");
  return {
    error: null,
    done:
      parsed.data.roleIds.length === 0
        ? "Roles cleared — they can sign in but won't see any tabs."
        : "Roles updated. It takes effect on their next click.",
  };
}

/**
 * Suspending is the reversible one and should be the default answer to
 * "they've left". `getConsoleActor` re-reads status on every request, so a
 * suspension ends an open session immediately rather than at expiry.
 */
export async function setStaffStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const staffId = String(formData.get("staffId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "active" && status !== "suspended") return;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("console_staff")
    .update({ status, updated_at: new Date().toISOString() })
    // Never flip an 'invited' account straight to active — that would
    // activate an account with no password set.
    .eq("id", staffId)
    .neq("status", "invited");

  if (error) console.error("failed to change staff status:", error);
  revalidatePath("/admin/staff");
}

export async function deleteStaff(formData: FormData): Promise<void> {
  await requireAdmin();

  const staffId = String(formData.get("staffId") ?? "");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("console_staff").delete().eq("id", staffId);
  if (error) console.error("failed to delete a staff member:", error);

  revalidatePath("/admin/staff");
}

/** Used by the staff form, which needs the role list to render checkboxes. */
export async function rolesForPicker() {
  await requireAdmin();
  return listRoles();
}
