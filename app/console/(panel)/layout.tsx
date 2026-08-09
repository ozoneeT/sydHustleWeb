import type { ReactNode } from "react";

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

  return <ConsoleNav>{children}</ConsoleNav>;
}
