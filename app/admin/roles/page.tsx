import { RoleEditor } from "@/components/admin/RoleEditor";
import { requireAdmin } from "@/lib/admin/dal";
import { listRoles, roleHolderCounts } from "@/lib/console/staff";

export const metadata = {
  title: "Roles — sydHustle Admin",
  robots: { index: false, follow: false },
};

export default async function RolesPage() {
  await requireAdmin();

  const [roles, counts] = await Promise.all([listRoles(), roleHolderCounts()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each role is a set of console tabs. Someone&apos;s access is the union
          of the roles they hold — there are no deny rules to reason about, so
          what you tick is exactly what they get.
        </p>
      </div>

      <RoleEditor roles={roles} holderCounts={Object.fromEntries(counts)} />
    </div>
  );
}
