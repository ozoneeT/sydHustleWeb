import Link from "next/link";
import { Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { firstAllowedPath, requireConsole } from "@/lib/console/dal";
import { tabLabel } from "@/lib/console/tabs";

export const metadata = { title: "No access — sydHustle Console" };

/**
 * Where a signed-in person lands when they open a tab their roles don't
 * include.
 *
 * Deliberately not the login page: being asked to sign in again when you
 * are already signed in reads as a broken session, and the usual response
 * is to try the password three times and then message someone. This says
 * what actually happened and what to do about it.
 */
export default async function DeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireConsole("any");
  const { tab } = await searchParams;

  const hasAnything = actor.permissions.length > 0;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/5">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight">
          {tab === "admin" ? "Superadmin only" : "You don't have access to this"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {tab === "admin"
            ? "Roles and staff are managed from a separate area that only the account owner can open."
            : tab
            ? `Your roles don't include ${tabLabel(tab)}. Ask whoever set up your account to add it.`
            : "Your account doesn't have any console tabs yet. Ask whoever invited you to give your role some access."}
        </p>

        {actor.kind === "staff" && (
          <p className="mt-4 text-xs text-muted-foreground">
            Signed in as {actor.email}
            {actor.permissions.length > 0 && (
              <>
                {" · "}
                {actor.permissions.map(tabLabel).join(", ")}
              </>
            )}
          </p>
        )}

        {hasAnything && (
          <Button asChild className="mt-6" variant="secondary">
            <Link href={firstAllowedPath(actor)}>Go to what you can open</Link>
          </Button>
        )}
      </Card>
    </div>
  );
}
