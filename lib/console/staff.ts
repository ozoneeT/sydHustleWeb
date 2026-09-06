import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isConsoleTab, type ConsoleTab } from "@/lib/console/tabs";
import { verifyPassword } from "@/lib/console/password";

/**
 * Reads and writes for console staff, their roles, and their invitations.
 *
 * The superadmin never appears in any of this. That account lives in the
 * environment, so the table can be empty, wrong, or briefly unreachable
 * without locking the person who administers it out of their own console.
 */

export interface ConsoleRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  status: "invited" | "active" | "suspended";
  created_at: string;
  last_login_at: string | null;
  roles: { id: string; name: string }[];
  /** The union of every role's tabs, minus anything no longer a real tab. */
  permissions: ConsoleTab[];
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // A week is long enough to notice the email.

/** Unknown keys are dropped rather than trusted: a tab removed from the
 * code must not keep granting anything just because a role still names it. */
function toTabs(values: readonly string[] | null | undefined): ConsoleTab[] {
  return [...new Set(values ?? [])].filter(isConsoleTab);
}

export async function listRoles(): Promise<ConsoleRole[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_roles")
    .select("id, name, description, permissions, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("failed to list console roles:", error);
    return [];
  }
  return (data as ConsoleRole[]) ?? [];
}

export async function getRole(id: string): Promise<ConsoleRole | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_roles")
    .select("id, name, description, permissions, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("failed to load console role:", error);
    return null;
  }
  return (data as ConsoleRole) ?? null;
}

/** How many people hold each role, so deleting one can say what it costs. */
export async function roleHolderCounts(): Promise<Map<string, number>> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("console_staff_roles").select("role_id");

  const counts = new Map<string, number>();
  if (error) {
    console.error("failed to count role holders:", error);
    return counts;
  }
  for (const row of data ?? []) {
    counts.set(row.role_id, (counts.get(row.role_id) ?? 0) + 1);
  }
  return counts;
}

type StaffRow = {
  id: string;
  email: string;
  name: string;
  status: StaffMember["status"];
  created_at: string;
  last_login_at: string | null;
  console_staff_roles: { console_roles: { id: string; name: string; permissions: string[] } | null }[];
};

const STAFF_COLUMNS = `
  id, email, name, status, created_at, last_login_at,
  console_staff_roles ( console_roles ( id, name, permissions ) )
`;

function toStaff(row: StaffRow): StaffMember {
  const roles = row.console_staff_roles
    .map((link) => link.console_roles)
    .filter((role): role is NonNullable<typeof role> => Boolean(role));

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    roles: roles.map((role) => ({ id: role.id, name: role.name })),
    permissions: toTabs(roles.flatMap((role) => role.permissions ?? [])),
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_staff")
    .select(STAFF_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("failed to list console staff:", error);
    return [];
  }
  return ((data as unknown as StaffRow[]) ?? []).map(toStaff);
}

export async function getStaff(id: string): Promise<StaffMember | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_staff")
    .select(STAFF_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("failed to load console staff member:", error);
    return null;
  }
  return toStaff(data as unknown as StaffRow);
}

/**
 * Sign-in. Returns null for every kind of failure — wrong address, wrong
 * password, never accepted the invitation, suspended — so the login form
 * can't be used to find out which console accounts exist.
 */
export async function authenticateStaff(
  rawEmail: string,
  password: string
): Promise<StaffMember | null> {
  const email = rawEmail.trim().toLowerCase();
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("console_staff")
    .select("id, password_hash, status")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("staff login lookup failed:", error);
    return null;
  }
  if (!data || data.status !== "active") return null;
  if (!(await verifyPassword(password, data.password_hash))) return null;

  await supabase
    .from("console_staff")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.id);

  return getStaff(data.id);
}

/**
 * Invitations.
 *
 * The token is random, sent once by email, and only its SHA-256 is stored —
 * a database dump therefore contains no usable way in. It is checked by
 * hashing what arrives and comparing, so a leaked backup and a leaked link
 * are different problems.
 */

export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PendingInvite {
  invitationId: string;
  staff: StaffMember;
}

export async function findInvite(token: string): Promise<PendingInvite | null> {
  const hash = hashToken(token.trim());
  if (!hash) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_invitations")
    .select("id, staff_id, token_hash, expires_at, accepted_at")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error) {
    console.error("failed to look up an invitation:", error);
    return null;
  }
  if (!data) return null;

  // Compared again in constant time. The lookup above is an indexed
  // equality match, which is the fast path; this is the one that decides.
  const given = Buffer.from(hash);
  const stored = Buffer.from(data.token_hash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) return null;

  if (data.accepted_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  const staff = await getStaff(data.staff_id);
  if (!staff || staff.status === "suspended") return null;

  return { invitationId: data.id, staff };
}

export async function createInvite(staffId: string): Promise<string | null> {
  const { token, hash } = newInviteToken();
  const supabase = createServerSupabaseClient();

  // Any invitation still outstanding for this person is spent, so a
  // re-invite immediately invalidates the link in the older email.
  await supabase
    .from("console_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("staff_id", staffId)
    .is("accepted_at", null);

  const { error } = await supabase.from("console_invitations").insert({
    staff_id: staffId,
    token_hash: hash,
    expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  });

  if (error) {
    console.error("failed to create an invitation:", error);
    return null;
  }
  return token;
}

export async function markInviteAccepted(invitationId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("console_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (error) console.error("failed to mark an invitation accepted:", error);
}

/** Whether an invite is still outstanding, for the staff list's status column. */
export async function pendingInviteExpiry(
  staffIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (staffIds.length === 0) return out;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_invitations")
    .select("staff_id, expires_at")
    .in("staff_id", staffIds)
    .is("accepted_at", null);

  if (error) {
    console.error("failed to read pending invitations:", error);
    return out;
  }
  for (const row of data ?? []) out.set(row.staff_id, row.expires_at);
  return out;
}

/** The live permission set for a signed-in staff member. */
export async function permissionsForStaff(staffId: string): Promise<{
  staff: StaffMember;
  permissions: ConsoleTab[];
} | null> {
  const staff = await getStaff(staffId);
  if (!staff || staff.status !== "active") return null;
  return { staff, permissions: staff.permissions };
}
