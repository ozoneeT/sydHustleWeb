"use client";

import { LogOut } from "lucide-react";

import { consoleLogout } from "@/lib/console/actions";

export function ConsoleLogoutButton() {
  return (
    <form action={consoleLogout}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Log out
      </button>
    </form>
  );
}
