"use client";

import { useActionState } from "react";

import { sendBroadcast, type BroadcastState } from "@/lib/console/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: BroadcastState = { error: null, sent: null };

export function BroadcastForm({ recipientCount }: { recipientCount: number }) {
  const [state, formAction, pending] = useActionState(
    sendBroadcast,
    initialState
  );

  if (state.sent !== null && state.error === null) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm">
        <p className="font-semibold text-emerald-400">
          Sent to {state.sent.toLocaleString()} users.
        </p>
        <p className="mt-1 text-muted-foreground">
          It&apos;s in everyone&apos;s notification list now, and pushes are
          going out to subscribed devices.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          maxLength={80}
          name="title"
          placeholder="e.g. Scheduled maintenance tonight"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          maxLength={500}
          name="body"
          placeholder="Keep it short — this lands on lock screens."
          required
          rows={4}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input className="mt-1" name="confirm" type="checkbox" />
        <span>
          I understand this goes to all{" "}
          <strong className="text-white">
            {recipientCount.toLocaleString()}
          </strong>{" "}
          users and cannot be unsent.
        </span>
      </label>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Sending…" : "Send to everyone"}
      </Button>
    </form>
  );
}
