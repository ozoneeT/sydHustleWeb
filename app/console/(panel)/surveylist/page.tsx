import Link from "next/link";
import { Send } from "lucide-react";

import { getAllResponses, getAllSurveyorsWithCounts } from "@/lib/survey/data";
import { buildContacts } from "@/lib/survey/contacts";
import { SURVEY_LIST_CHANNEL } from "@/lib/survey/realtime";
import { requireConsole } from "@/lib/console/dal";
import { RealtimeRefresher } from "@/components/surveylist/RealtimeRefresher";
import { ContactsTable } from "@/components/surveylist/ContactsTable";
import { ResponsesList } from "@/components/surveylist/ResponsesList";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Survey list — sydHustle Console",
};

/**
 * The pre-launch contact sheet, now a console tab rather than its own
 * address with its own password.
 *
 * It moved here for two reasons: one sign-in instead of two, and — the
 * point of the move — so a role can grant it. Somebody running the campus
 * marketing push can be given Survey list and Email campaigns and nothing
 * else, which was impossible while the list sat behind the owner's own
 * credentials.
 */
export default async function SurveyListPage() {
  await requireConsole("surveylist");

  const [surveyors, responses] = await Promise.all([
    getAllSurveyorsWithCounts(),
    getAllResponses(),
  ]);

  const contacts = buildContacts(responses, surveyors);
  const surveyorNames = Object.fromEntries(surveyors.map((s) => [s.id, s.name]));

  const reachable = new Set(
    contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]
  ).size;
  const marketingCount = responses.filter((r) => r.join_marketing_team === "yes").length;
  const phoneCount = contacts.filter((c) => c.phone).length;

  return (
    <div className="space-y-10">
      <RealtimeRefresher channelName={SURVEY_LIST_CHANNEL} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Survey list</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Everyone who answered the survey, plus the moderators who collected
            it. These are the people to invite to sign up first.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/console/campaigns/new">
            <Send className="h-4 w-4" />
            Email these contacts
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Survey responses"
          value={responses.length}
          hint={`${contacts.length} contacts incl. moderators`}
        />
        <StatCard
          label="Reachable by email"
          value={reachable}
          hint={`${responses.length - reachable} left no address`}
        />
        <StatCard
          label="Phone numbers"
          value={phoneCount}
          hint="From the marketing-team question"
        />
        <StatCard
          label="Would join marketing"
          value={marketingCount}
          hint={`${
            responses.length ? Math.round((marketingCount / responses.length) * 100) : 0
          }% of responses`}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Contacts</h2>
          <p className="text-sm text-muted-foreground">
            Click any email or phone number to copy it.
          </p>
        </div>
        <ContactsTable contacts={contacts} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Moderators</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">PIN</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Responses</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {surveyors.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono tracking-widest text-accent">
                    {s.pin}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.role === "admin" ? "Admin" : "Moderator"}
                  </td>
                  <td className="px-4 py-3">{s.responseCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {surveyors.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No moderators yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">All responses</h2>
          <p className="text-sm text-muted-foreground">
            Click a response to see the full survey answers.
          </p>
        </div>
        <ResponsesList
          responses={responses}
          surveyorNames={surveyorNames}
          emptyMessage="No survey responses yet."
        />
      </div>
    </div>
  );
}
