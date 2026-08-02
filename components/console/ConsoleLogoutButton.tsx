"use client";

import { consoleLogout } from "@/lib/console/actions";
import { Button } from "@/components/ui/button";

export function ConsoleLogoutButton() {
  return (
    <form action={consoleLogout}>
      <Button size="sm" type="submit" variant="secondary">
        Log out
      </Button>
    </form>
  );
}
