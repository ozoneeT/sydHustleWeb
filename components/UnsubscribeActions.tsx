"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { resubscribe, unsubscribe } from "@/lib/email/actions";
import { Button } from "@/components/ui/button";

/**
 * The two buttons on the unsubscribe page. A resubscribe is offered as
 * plainly as the unsubscribe, because the commonest reason someone lands
 * here is a mis-tap on a phone.
 */
export function UnsubscribeActions({
  email,
  token,
  subscribed,
}: {
  email: string;
  token: string;
  subscribed: boolean;
}) {
  const [on, setOn] = useState(subscribed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = next ? await resubscribe(token) : await unsubscribe(token);
      if (result.ok) setOn(next);
      else setError(result.error);
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {on ? (
        <Button className="w-full" disabled={pending} onClick={() => act(false)}>
          {pending ? "Unsubscribing…" : "Unsubscribe me"}
        </Button>
      ) : (
        <Button
          className="w-full"
          variant="secondary"
          disabled={pending}
          onClick={() => act(true)}
        >
          {pending ? "Resubscribing…" : `Resubscribe ${email}`}
        </Button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button asChild className="w-full" variant="ghost">
        <Link href="/">Back to sydHustle</Link>
      </Button>
    </div>
  );
}
