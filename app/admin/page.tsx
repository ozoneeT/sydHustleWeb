import Link from "next/link";
import { ArrowRight, KeyRound, UserPlus, Users } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasAdminSession } from "@/lib/admin/session";
import { listRoles, listStaff } from "@/lib/console/staff";
import { CONSOLE_TABS } from "@/lib/console/tabs";

export const metadata = {
  title: "Admin — sydHustle",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That email and password don't match.";
    case "config":
      return "Admin sign-in is not configured on this deployment.";
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasAdminSession())) {
    const { error } = await searchParams;
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm p-8">
          <h1 className="text-xl font-bold tracking-tight">Admin sign-in</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Use the account owner&apos;s details. This area decides who can open
            what, so it asks again even if you&apos;re already in the console.
          </p>
          <AdminLoginForm error={errorMessage(error)} />
        </Card>
      </div>
    );
  }

  const [roles, staff] = await Promise.all([listRoles(), listStaff()]);

  const active = staff.filter((s) => s.status === "active").length;
  const invited = staff.filter((s) => s.status === "invited").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Access control</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A role is a set of console tabs. Give someone a role and they can
          open those tabs and nothing else — no role, no access, even if they
          know the URL.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Roles" value={roles.length} />
        <StatCard
          label="Staff"
          value={active}
          hint={invited > 0 ? `${invited} invited, not yet signed in` : undefined}
        />
        <StatCard
          label="Console tabs"
          value={CONSOLE_TABS.length}
          hint="Everything a role can be given"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
            <KeyRound className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Roles</h2>
            <p className="text-sm text-muted-foreground">
              Create a role and tick the tabs it opens. Four starters ship with
              the system — edit or delete any of them.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="self-start">
            <Link href="/admin/roles">
              Manage roles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
            {staff.length === 0 ? (
              <UserPlus className="h-5 w-5 text-accent" />
            ) : (
              <Users className="h-5 w-5 text-accent" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">Staff</h2>
            <p className="text-sm text-muted-foreground">
              {staff.length === 0
                ? "Nobody yet. Invite someone by email and pick their role — they set their own password from the link."
                : `${staff.length} ${staff.length === 1 ? "person" : "people"}, and you can invite more at any time.`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="self-start">
            <Link href="/admin/staff">
              {staff.length === 0 ? "Invite the first" : "Manage staff"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>

      <Card className="border-amber-500/30 p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-amber-300">The owner account is not on this list</p>
        <p className="mt-1">
          It lives in the deployment&apos;s environment, not the database, so it
          can&apos;t be demoted, deleted or locked out through this screen — and
          an empty staff list is still a working console. Nobody invited here
          can ever reach /admin.
        </p>
      </Card>
    </div>
  );
}
