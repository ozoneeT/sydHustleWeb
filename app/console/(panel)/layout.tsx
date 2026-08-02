import type { ReactNode } from "react";

import { ConsoleLogoutButton } from "@/components/console/ConsoleLogoutButton";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { requireConsole } from "@/lib/console/dal";

export const metadata = {
  robots: { index: false, follow: false },
};

// The books change constantly; nothing here should be statically cached.
export const dynamic = "force-dynamic";

export default async function ConsolePanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireConsole();

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tight">
              sydHustle <span className="text-accent">Console</span>
            </span>
            <ConsoleNav />
          </div>
          <ConsoleLogoutButton />
        </div>
      </header>
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
