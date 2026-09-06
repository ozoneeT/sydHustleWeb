import { redirect } from "next/navigation";

import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { firstAllowedPath, getConsoleActor } from "@/lib/console/dal";
import { deleteConsoleSession } from "@/lib/console/session";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Console — sydHustle",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That email and password don't match.";
    case "config":
      return "Console sign-in is not configured on this deployment.";
    default:
      return null;
  }
}

export default async function ConsoleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await getConsoleActor();
  if (actor) {
    // Somewhere they can actually open — sending a member of staff to
    // /console/overview would bounce them off a tab they may not hold.
    redirect(firstAllowedPath(actor));
  }

  const { error } = await searchParams;

  // A token that still verifies but resolves to nobody — suspended, or a
  // staff row that has been deleted. Clearing it here is what stops the
  // login page and the panel layout redirecting to each other forever.
  await deleteConsoleSession();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-bold tracking-tight">sydHustle Console</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Operators only. Every visit is on the record.
        </p>
        <ConsoleLoginForm error={errorMessage(error)} />
      </Card>
    </main>
  );
}
