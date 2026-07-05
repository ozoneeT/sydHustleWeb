import { requireAdmin } from "@/lib/moderator/dal";
import { getAllResponses, getAllSurveyorsWithCounts } from "@/lib/moderator/data";
import { ADMIN_CHANNEL } from "@/lib/moderator/realtime";
import { RealtimeRefresher } from "@/components/moderator/RealtimeRefresher";
import { ResponsesTable } from "@/components/moderator/ResponsesTable";
import { StatCard } from "@/components/moderator/StatCard";
import { LogoutButton } from "@/components/moderator/LogoutButton";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Admin dashboard — sydHustle",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [surveyors, responses] = await Promise.all([
    getAllSurveyorsWithCounts(),
    getAllResponses(),
  ]);

  const surveyorNames = Object.fromEntries(surveyors.map((s) => [s.id, s.name]));
  const unlinkedCount = responses.filter((r) => !r.surveyor_id).length;
  const marketingCount = responses.filter(
    (r) => r.join_marketing_team === "yes"
  ).length;

  return (
    <>
      <SiteHeader />
      <RealtimeRefresher channelName={ADMIN_CHANNEL} />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <h1 className="text-3xl font-bold tracking-tight">{admin.name}</h1>
            </div>
            <LogoutButton />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total responses" value={responses.length} />
            <StatCard label="Active surveyors" value={surveyors.length} />
            <StatCard
              label="Would join marketing team"
              value={marketingCount}
            />
            <StatCard
              label="Unlinked responses"
              value={unlinkedCount}
              hint={unlinkedCount > 0 ? "Missing a surveyor PIN" : undefined}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Surveyors</h2>
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
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {s.role}
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
                        No surveyors yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">All responses</h2>
            <ResponsesTable
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
