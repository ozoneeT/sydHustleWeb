"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateNotificationProviders, type NotificationProvidersState } from "@/lib/console/actions";

const initial: NotificationProvidersState = { error: null, saved: false };

export function NotificationProvidersForm({ email, sms }: { email: "resend" | "zapiack"; sms: "twilio" | "zapiack" }) {
  const [state, action, pending] = useActionState(updateNotificationProviders, initial);
  const [emailValue, setEmail] = useState(email);
  const [smsValue, setSms] = useState(sms);
  return <form action={action} className="space-y-5 rounded-xl border border-white/10 p-5">
    <div><h3 className="font-semibold">Email delivery</h3><p className="text-sm text-muted-foreground">Zapiack email requires approved templates and template IDs configured in Supabase secrets.</p>
      <select className="mt-2 rounded-md bg-background p-2" name="email_provider" value={emailValue} onChange={(e) => setEmail(e.target.value as typeof emailValue)}><option value="resend">Resend</option><option value="zapiack">Zapiack</option></select>
    </div>
    <div><h3 className="font-semibold">SMS delivery</h3><p className="text-sm text-muted-foreground">Switches phone verification and SMS alerts together.</p>
      <select className="mt-2 rounded-md bg-background p-2" name="sms_provider" value={smsValue} onChange={(e) => setSms(e.target.value as typeof smsValue)}><option value="twilio">Twilio</option><option value="zapiack">Zapiack</option></select>
    </div>
    <div className="flex items-center gap-3"><Button disabled={pending}>{pending ? "Saving…" : "Save delivery providers"}</Button>{state.error && <span className="text-sm text-red-400">{state.error}</span>}{state.saved && <span className="text-sm text-emerald-400">Saved. Applies to new messages.</span>}</div>
  </form>;
}
