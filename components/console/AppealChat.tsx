"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  sendAppealMessage,
  type AppealMessageState,
} from "@/lib/console/appeal-actions";

type Message = {
  id: string;
  authorRole: "admin" | "provider" | "hustler";
  recipientRole: "provider" | "hustler" | null;
  body: string | null;
  createdAt: string;
  attachment: {
    kind: "image" | "file";
    name: string | null;
    url: string | null;
  } | null;
};

type AppealChatProps = {
  kind: "hustle" | "booking";
  sourceId: string;
  providerName: string;
  hustlerName: string;
  messages: Message[];
  /** A decided appeal is a closed record — readable, not writable. */
  readOnly: boolean;
};

const INITIAL: AppealMessageState = { error: null, sent: false };

function timeOf(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The hearing.
 *
 * Every admin message is addressed to exactly one side, and the transcript
 * says so on every line — the admin is talking to two people who are not
 * talking to each other, and a thread that didn't show who was being
 * asked what would be impossible to follow a week later.
 *
 * Replies arrive from the app. This view is the full record; each party
 * only ever sees their own half of it (enforced in RLS, not here).
 */
export function AppealChat({
  kind,
  sourceId,
  providerName,
  hustlerName,
  messages,
  readOnly,
}: AppealChatProps) {
  const [state, formAction, pending] = useActionState(sendAppealMessage, INITIAL);
  const [recipient, setRecipient] = useState<"provider" | "hustler">("provider");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sent) formRef.current?.reset();
  }, [state.sent]);

  return (
    <div className="flex flex-col rounded-xl border border-white/10">
      <div className="max-h-[28rem] space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No questions asked yet. Start with whichever side you need to
            hear from first.
          </p>
        ) : (
          messages.map((message) => {
            const fromAdmin = message.authorRole === "admin";
            const who = fromAdmin
              ? `You → ${message.recipientRole === "provider" ? providerName : hustlerName}`
              : `${message.authorRole === "provider" ? providerName : hustlerName} → You`;

            return (
              <div
                className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    fromAdmin
                      ? "bg-accent/15 text-white"
                      : message.authorRole === "provider"
                        ? "bg-sky-500/10 text-white"
                        : "bg-emerald-500/10 text-white"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {who}
                  </p>
                  {message.attachment?.url ? (
                    <a
                      className="mt-2 block"
                      href={message.attachment.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {message.attachment.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- signed, expiring URL on a private bucket; the image optimiser would cache it past its TTL
                        <img
                          alt={message.attachment.name ?? "Evidence"}
                          className="max-h-64 rounded-lg border border-white/10"
                          src={message.attachment.url}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15">
                          📎 {message.attachment.name ?? "Attachment"}
                        </span>
                      )}
                    </a>
                  ) : null}
                  {message.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {message.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {timeOf(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {readOnly ? (
        <p className="border-t border-white/10 p-4 text-center text-sm text-muted-foreground">
          This appeal has been decided. The transcript is kept as the record.
        </p>
      ) : (
        <form
          action={formAction}
          className="space-y-3 border-t border-white/10 p-4"
          ref={formRef}
        >
          <input name="kind" type="hidden" value={kind} />
          <input name="sourceId" type="hidden" value={sourceId} />
          <input name="recipientRole" type="hidden" value={recipient} />

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Ask
            </span>
            {(
              [
                ["provider", providerName],
                ["hustler", hustlerName],
              ] as const
            ).map(([role, name]) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  recipient === role
                    ? "bg-white/10 font-semibold text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
                key={role}
                onClick={() => setRecipient(role)}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>

          <Textarea
            name="body"
            placeholder={`Question for ${recipient === "provider" ? providerName : hustlerName}…`}
            required
            rows={3}
          />

          {state.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          <Button disabled={pending} type="submit">
            {pending ? "Sending…" : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}
