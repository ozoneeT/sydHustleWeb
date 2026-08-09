import type { ReactNode } from "react";

import { ConsoleNav } from "@/components/console/ConsoleNav";

export const metadata = {
  robots: { index: false, follow: false },
};

// Auth is enforced in proxy.ts for /console/* so this layout stays sync —
// that lets loading.tsx show instantly on client navigations.

export default function ConsolePanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ConsoleNav>{children}</ConsoleNav>;
}
