import { redirect } from "next/navigation";

import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { hasConsoleSession } from "@/lib/console/session";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Console — sydHustle",
  robots: { index: false, follow: false },
};

export default async function ConsoleLoginPage() {
  if (await hasConsoleSession()) {
    redirect("/console/overview");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-bold tracking-tight">sydHustle Console</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Operators only. Every visit is on the record.
        </p>
        <ConsoleLoginForm />
      </Card>
    </main>
  );
}
