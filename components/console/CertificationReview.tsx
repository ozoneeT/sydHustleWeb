"use client";

import { useActionState, useState } from "react";
import {
  BadgeCheck,
  Clock,
  FileText,
  MessageSquare,
  ShieldX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  certifySkill,
  rejectCertification,
  requestCertificationInfo,
  type CertificationActionState,
} from "@/lib/console/certification-actions";
import type { CertificationReview as Review } from "@/lib/console/certifications";
import { shortDate } from "@/lib/console/format";
import { cn } from "@/lib/utils";

const INITIAL: CertificationActionState = { error: null, done: null };

const STATUS_COPY: Record<
  Review["status"],
  { label: string; className: string }
> = {
  submitted: {
    label: "Waiting on us",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  needs_info: {
    label: "Waiting on them",
    className: "border-white/15 bg-white/5 text-muted-foreground",
  },
  certified: {
    label: "Certified",
    className: "border-accent/30 bg-accent/10 text-accent",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  },
};

/**
 * One certification, with everything needed to decide it in one place.
 *
 * Documents, the thread so far, and the three actions. No modal and no second
 * screen: a reviewer comparing a licence photo against a name should not have
 * to hold either in their head while a dialog covers the other.
 */
export function CertificationReview({ review }: { review: Review }) {
  const [open, setOpen] = useState<"ask" | "certify" | "reject" | null>(null);
  const status = STATUS_COPY[review.status];

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <header className="flex flex-wrap items-start gap-4 p-5">
        {review.coverPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt=""
            className="size-14 shrink-0 rounded-lg object-cover"
            src={review.coverPhoto}
          />
        ) : (
          <div className="size-14 shrink-0 rounded-lg bg-white/10" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{review.displayName}</h2>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {review.skillName} · {review.hustlerName}
            {review.hustlerEmail ? ` · ${review.hustlerEmail}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Submitted {shortDate(review.submittedAt)}
            {review.decidedAt
              ? ` · decided ${shortDate(review.decidedAt)}${
                  review.decidedBy ? ` by ${review.decidedBy}` : ""
                }`
              : ""}
          </p>
        </div>
      </header>

      <div className="border-t border-white/10 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Documents
        </h3>
        {review.documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing uploaded yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {review.documents.map((doc) => (
              <li key={doc.id}>
                <a
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  href={doc.url ?? "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  <FileText className="size-4 text-accent" />
                  {doc.label ?? "Document"}
                  <span className="text-xs text-muted-foreground">
                    {shortDate(doc.uploadedAt)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {review.documents.length > 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Links are signed and expire in ten minutes. Reload the page to open
            them again.
          </p>
        ) : null}
      </div>

      {review.messages.length > 0 ? (
        <div className="border-t border-white/10 p-5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquare className="size-3.5" />
            Thread
          </h3>
          <ol className="mt-3 space-y-3">
            {review.messages.map((message) => (
              <li
                className={cn(
                  "rounded-lg border p-3 text-sm leading-relaxed",
                  message.authorRole === "admin"
                    ? "border-accent/20 bg-accent/5"
                    : "border-white/10 bg-white/5",
                )}
                key={message.id}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {message.authorRole === "admin" ? "sydHustle" : "Hustler"} ·{" "}
                  {shortDate(message.createdAt)}
                </p>
                <p className="whitespace-pre-wrap">{message.body}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <footer className="flex flex-wrap gap-2 border-t border-white/10 p-5">
        <Button onClick={() => setOpen(open === "ask" ? null : "ask")} variant="secondary">
          <MessageSquare className="size-4" />
          Ask for more
        </Button>
        <Button onClick={() => setOpen(open === "certify" ? null : "certify")}>
          <BadgeCheck className="size-4" />
          Certify
        </Button>
        <Button
          className="text-red-300 hover:bg-red-500/10"
          onClick={() => setOpen(open === "reject" ? null : "reject")}
          variant="ghost"
        >
          <ShieldX className="size-4" />
          Reject
        </Button>
      </footer>

      {open === "ask" ? (
        <ActionForm
          action={requestCertificationInfo}
          cta="Send request"
          hint="This exact text is what they read in the app and what the email quotes. Write it as an instruction: what to send, and why the last one was not enough."
          label="What do you need from them?"
          onDone={() => setOpen(null)}
          skillId={review.skillId}
        />
      ) : null}

      {open === "certify" ? (
        <ActionForm
          action={certifySkill}
          cta="Certify this Skill"
          hint="Optional, internal. The Hustler sees a plain confirmation, not this."
          label="Note for the record"
          onDone={() => setOpen(null)}
          optional
          skillId={review.skillId}
        />
      ) : null}

      {open === "reject" ? (
        <ActionForm
          action={rejectCertification}
          cta="Reject"
          hint="They read this. A refusal with no reason becomes a support thread either way, so give them the one thing that would change the answer."
          label="Why can this not be certified?"
          onDone={() => setOpen(null)}
          skillId={review.skillId}
        />
      ) : null}
    </section>
  );
}

function ActionForm({
  action,
  cta,
  hint,
  label,
  onDone,
  optional,
  skillId,
}: {
  action: (
    previous: CertificationActionState,
    formData: FormData,
  ) => Promise<CertificationActionState>;
  cta: string;
  hint: string;
  label: string;
  onDone: () => void;
  optional?: boolean;
  skillId: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  // Deliberately NOT auto-closing on success. Closing from here would mean
  // setting the parent's state while this component renders, and the honest
  // version is better anyway: the confirmation stays until it is dismissed,
  // so nobody wonders whether a form that vanished actually sent.
  if (state.done) {
    return (
      <div className="border-t border-white/10 p-5">
        <p className="text-sm font-semibold text-accent">{state.done}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The status above updates on the next load. An email has gone out if
          they have one on file.
        </p>
        <Button className="mt-3" onClick={onDone} type="button" variant="secondary">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="border-t border-white/10 p-5">
      <input name="skillId" type="hidden" value={skillId} />
      <label className="text-sm font-semibold" htmlFor={`body-${skillId}`}>
        {label}
      </label>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <Textarea
        className="mt-3"
        id={`body-${skillId}`}
        name={optional ? "note" : "body"}
        placeholder={
          optional
            ? "Checked against the NECA register."
            : "The photo of your licence is cut off at the bottom - send one showing the expiry date and the licence number."
        }
        rows={4}
      />
      {state.error ? (
        <p className="mt-2 text-sm text-amber-400">{state.error}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Sending..." : cta}
        </Button>
        <Button onClick={onDone} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
