import Link from "next/link";
import { notFound } from "next/navigation";

import { FeatureRestrictions } from "@/components/console/FeatureRestrictions";
import { Card } from "@/components/ui/card";
import { requireConsole } from "@/lib/console/dal";
import { shortDate } from "@/lib/console/format";
import { getConsoleUser, listRestrictions } from "@/lib/console/restrictions";

export const metadata = { title: "User — sydHustle Console" };
export const dynamic = "force-dynamic";

/**
 * One account, and what it is currently allowed to do.
 *
 * Deliberately not another place to suspend somebody. Account-level
 * sanctions belong on the report that prompted them, where the evidence
 * and the in-flight work are both on screen; this page is for the smaller
 * instrument, which is usually reached from a name rather than from a case.
 */
export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  await requireConsole();
  const { profileId } = await params;

  const profile = await getConsoleUser(profileId);
  if (!profile) notFound();

  const restrictions = await listRestrictions(profileId);
  const suspended = profile.suspended;

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/console/users"
        >
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {profile.full_name ?? "Unnamed account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.school ?? "No school"} · joined{" "}
          {shortDate(profile.created_at)}
        </p>
      </div>

      {suspended ? (
        // Shown before the switches, not after: pausing one feature on an
        // account that is already wholly suspended does nothing the user
        // would notice, and a moderator should know that before spending
        // time on it.
        <Card className="border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
          {profile.terminated_at
            ? "This account is terminated. Everything below is already blocked."
            : `This account is suspended until ${new Date(
                profile.suspended_until!
              ).toLocaleString("en-NG")}. Everything below is already blocked.`}
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Feature access</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Pause one thing while a report or review is open, instead of the
          whole account. Work already agreed keeps running either way — these
          stop new actions, not in-flight ones.
        </p>
        <FeatureRestrictions
          profileId={profileId}
          restrictions={restrictions}
        />
      </Card>

      {restrictions.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">History</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Everything ever paused on this account, including what has since
            expired — so a repeat is visible as a repeat.
          </p>
          <ul className="space-y-2 text-sm">
            {restrictions.map((r) => (
              <li
                className="rounded-lg border border-white/10 p-3"
                key={`${r.feature}-${r.created_at}`}
              >
                <span className="font-medium">{r.feature}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {shortDate(r.created_at)} ·{" "}
                  {r.restricted_until
                    ? `until ${new Date(r.restricted_until).toLocaleString("en-NG")}`
                    : "indefinite"}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
