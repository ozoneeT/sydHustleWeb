"use client";

import { Button } from "@/components/ui/button";

/** A transaction record that cannot leave the screen is not much use in
 * a bank or police enquiry. The page's print styles drop the console
 * chrome, so this produces the record itself and nothing else. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} variant="secondary">
      Print / save as PDF
    </Button>
  );
}
