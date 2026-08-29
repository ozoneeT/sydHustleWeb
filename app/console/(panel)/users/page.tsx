import Link from "next/link";

import { listUsers } from "@/lib/console/data";
import { naira, shortDate } from "@/lib/console/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Users — sydHustle Console" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await listUsers(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Latest {users.length} accounts{q ? ` matching “${q}”` : ""}, with
            wallet balances.
          </p>
        </div>
        <form action="/console/users" className="flex gap-2">
          <Input
            className="w-56"
            defaultValue={q ?? ""}
            name="q"
            placeholder="Search by name…"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-white/5" key={user.id}>
                <td className="px-4 py-3 font-medium">
                  {/* The name is the way in to everything done about a
                      person - feature pauses today, whatever the desk needs
                      next. A row that is not clickable makes moderators
                      search for the same account twice. */}
                  <Link
                    className="hover:text-accent hover:underline"
                    href={`/console/users/${user.id}`}
                  >
                    {user.full_name ?? "Unnamed account"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.school ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {naira(user.balance)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(user.created_at)}
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
