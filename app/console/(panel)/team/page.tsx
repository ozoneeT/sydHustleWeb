import { TeamRoster } from "@/components/console/TeamRoster";
import { requireConsole } from "@/lib/console/dal";
import { listTeam } from "@/lib/team/data";

export const metadata = { title: "Team members — sydHustle Console" };

/**
 * The roster, and the only door into the team area.
 *
 * sydHustle is being built by people working unpaid against a promise of a
 * share later. Signup is closed by design: a number is typed in here
 * first, and only then can the person behind it create an account. That
 * keeps the ledger a list of people who were actually asked to help,
 * rather than whoever found the URL.
 */
export default async function TeamPage() {
  await requireConsole("team");
  const members = await listTeam();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team members</h1>
        <p className="text-sm text-muted-foreground">
          Who is allowed to post contributions. Adding a number is what lets
          someone sign up — nobody can create an account on their own.
        </p>
      </div>

      <TeamRoster members={members} />
    </div>
  );
}
