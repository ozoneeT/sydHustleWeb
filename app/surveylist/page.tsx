import Link from "next/link";

import { getAllResponses, getAllSurveyorsWithCounts } from "@/lib/survey/data";
import { buildContacts } from "@/lib/survey/contacts";
import { SURVEY_LIST_CHANNEL } from "@/lib/survey/realtime";
import { hasSurveyListSession } from "@/lib/surveylist/session";
import { RealtimeRefresher } from "@/components/surveylist/RealtimeRefresher";
import { ContactsTable } from "@/components/surveylist/ContactsTable";
import { ResponsesList } from "@/components/surveylist/ResponsesList";
import { SurveyListLoginForm } from "@/components/surveylist/SurveyListLoginForm";
import { LogoutButton } from "@/components/surveylist/LogoutButton";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Survey list — sydHustle",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That email and password don't match.";
    case "config":
      return "Sign-in is not configured on this deployment.";
    default:
      return null;
  }
}

export default async function SurveyListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasSurveyListSession())) {
    const { error } = await searchParams;
    return (
      <>
        <SiteHeader />
        <main className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="animate-blob-a absolute left-1/2 top-[-160px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]" />
          </div>
          <Card className="w-full max-w-sm p-8">
            <h1 className="text-xl font-bold tracking-tight">Survey list</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              Sign in with the admin details. Every visit is on the record.
            </p>
            <SurveyListLoginForm error={errorMessage(error)} />
          </Card>
        </main>
        <Footer />
      </>
    );
  }

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
    <>
      <SiteHeader />
      <RealtimeRefresher channelName={SURVEY_LIST_CHANNEL} />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pre-launch outreach</p>
              <h1 className="text-3xl font-bold tracking-tight">Survey list</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Everyone who answered the survey, plus the moderators who
                collected it. These are the people to invite to sign up first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="secondary" size="sm">
                <Link href="/console/campaigns/new">Email these contacts</Link>
              </Button>
              <LogoutButton />
            </div>
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
      </main>
      <Footer />
    </>
  );
}
