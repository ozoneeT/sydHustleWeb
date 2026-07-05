import { requireSurveyor } from "@/lib/moderator/dal";
import { getResponsesForSurveyor } from "@/lib/moderator/data";
import { surveyorChannel } from "@/lib/moderator/realtime";
import { RealtimeRefresher } from "@/components/moderator/RealtimeRefresher";
import { ResponsesTable } from "@/components/moderator/ResponsesTable";
import { StatCard } from "@/components/moderator/StatCard";
import { LogoutButton } from "@/components/moderator/LogoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Surveyor dashboard — sydHustle",
};

export default async function DashboardPage() {
  const surveyor = await requireSurveyor();
  const responses = await getResponsesForSurveyor(surveyor.id);

  const marketingCount = responses.filter(
    (r) => r.join_marketing_team === "yes"
  ).length;

  return (
    <>
      <SiteHeader />
      <RealtimeRefresher channelName={surveyorChannel(surveyor.id)} />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="text-3xl font-bold tracking-tight">{surveyor.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <span className="text-muted-foreground">Your PIN: </span>
                <span className="font-mono font-semibold tracking-widest text-accent">
                  {surveyor.pin}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total responses" value={responses.length} />
            <StatCard
              label="Would join marketing team"
              value={marketingCount}
              hint={`${responses.length ? Math.round((marketingCount / responses.length) * 100) : 0}% of your responses`}
            />
            <StatCard
              label="Latest response"
              value={
                responses[0]
                  ? new Date(responses[0].created_at).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Your responses</h2>
            <ResponsesTable
              responses={responses}
              emptyMessage="No one has taken the survey with your PIN yet. Share your PIN to get started."
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
