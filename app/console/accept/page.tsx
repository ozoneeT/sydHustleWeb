import { AcceptInviteForm } from "@/components/console/AcceptInviteForm";
import { Card } from "@/components/ui/card";
import { findInvite } from "@/lib/console/staff";
import { tabLabel } from "@/lib/console/tabs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accept your console invitation — sydHustle",
  robots: { index: false, follow: false },
};

/**
 * Where an invitation email lands.
 *
 * The token in the URL is the only credential: it proves the person opening
 * this page controls the address the invitation was sent to. Nothing here
 * is created until they choose a password — an invitation that is opened
 * and abandoned leaves an account that still cannot sign in.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await findInvite(token) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md p-8">
        {!invite ? (
          <>
            <h1 className="text-xl font-bold tracking-tight">
              This invitation isn&apos;t valid
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have expired, already been used, or been replaced by a
              newer one. Ask whoever invited you to send another.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight">
              Welcome, {invite.staff.name.split(/\s+/)[0]}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a password for{" "}
              <span className="font-medium text-foreground">
                {invite.staff.email}
              </span>
              . You&apos;ll use it to sign in to the sydHustle console.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Your access
              </p>
              <p className="mt-1 text-sm">
                {invite.staff.roles.length > 0
                  ? invite.staff.roles.map((role) => role.name).join(", ")
                  : "No role assigned yet"}
              </p>
              {invite.staff.permissions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {invite.staff.permissions.map(tabLabel).join(" · ")}
                </p>
              )}
            </div>

            <AcceptInviteForm token={token ?? ""} />
          </>
        )}
      </Card>
    </main>
  );
}
