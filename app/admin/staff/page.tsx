import Link from "next/link";

import { StaffManager } from "@/components/admin/StaffManager";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/dal";
import { listRoles, listStaff, pendingInviteExpiry } from "@/lib/console/staff";

export const metadata = {
  title: "Staff — sydHustle Admin",
  robots: { index: false, follow: false },
};

export default async function StaffPage() {
  await requireAdmin();

  const [staff, roles] = await Promise.all([listStaff(), listRoles()]);
  const expiry = await pendingInviteExpiry(
    staff.filter((member) => member.status === "invited").map((member) => member.id)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Invite someone by email and pick their roles. They set their own
          password from the link — you never see it, and nobody here can reach
          this page.
        </p>
      </div>

      {roles.length === 0 && (
        <Card className="border-amber-500/30 p-4 text-sm text-muted-foreground">
          There are no roles yet.{" "}
          <Link href="/admin/roles" className="text-accent hover:underline">
            Create one first
          </Link>{" "}
          — an invitation without a role signs someone in to an empty console.
        </Card>
      )}

      <StaffManager
        staff={staff}
        roles={roles}
        inviteExpiry={Object.fromEntries(expiry)}
      />
    </div>
  );
}
