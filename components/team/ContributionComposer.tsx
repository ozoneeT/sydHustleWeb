"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Paperclip, X } from "lucide-react";

import {
  postContribution,
  type ContributionState,
} from "@/lib/team/contribution-actions";
import {
  CONTRIBUTION_CATEGORIES,
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_CONTRIBUTION,
  MEDIA_ACCEPT_ATTRIBUTE,
  formatBytes,
  isAllowedMediaType,
} from "@/lib/team/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initial: ContributionState = { error: null, posted: false };

interface UploadSlot {
  /** The object key the server chose — always under this member's prefix. */
  key: string;
  /** A presigned R2 URL this browser may PUT exactly one file to. */
  url: string;
}

/**
 * Posting a contribution.
 *
 * The text goes through a Server Action; the files do not. Each file is
 * PUT straight from this browser to Cloudflare R2 using a one-time URL the
 * server signs first, and only the resulting keys travel with the form.
 * That is why this submits with an onClick and an explicit transition
 * rather than a plain `<form action>` — the uploads have to finish, and
 * their paths have to be in the FormData, before the action is allowed to
 * run.
 */
export function ContributionComposer({ today }: { today: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [posting, startPosting] = useTransition();
  const [state, setState] = useState<ContributionState>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function addFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    setLocalError(null);

    const next = [...files];
    for (const file of Array.from(picked)) {
      if (next.length >= MAX_MEDIA_PER_CONTRIBUTION) {
        setLocalError(`Up to ${MAX_MEDIA_PER_CONTRIBUTION} files on one entry.`);
        break;
      }
      if (!isAllowedMediaType(file.type)) {
        setLocalError(`${file.name} isn't a photo, video, audio file or PDF.`);
        continue;
      }
      if (file.size > MAX_MEDIA_BYTES) {
        setLocalError(
          `${file.name} is ${formatBytes(file.size)} — ${formatBytes(
            MAX_MEDIA_BYTES
          )} is the limit.`
        );
        continue;
      }
      next.push(file);
    }
    setFiles(next);
    // Cleared so picking the same file twice in a row still fires onChange.
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Uploads everything and returns what to attach, or null if any of it
   * failed — a half-uploaded set must not become a half-evidenced claim. */
  async function uploadAll(): Promise<
    { path: string; mime: string; size: number }[] | null
  > {
    if (files.length === 0) return [];

    const response = await fetch("/team/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: files.map((file) => ({
          name: file.name,
          mime: file.type,
          size: file.size,
        })),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setLocalError(payload?.error ?? "Couldn't start the upload. Try again.");
      return null;
    }

    const { slots } = (await response.json()) as { slots: UploadSlot[] };

    const attached: { path: string; mime: string; size: number }[] = [];

    // One at a time rather than in parallel: these are phones on Nigerian
    // mobile data, and six 25MB uploads racing each other finish slower
    // than six in a row while making the progress text meaningless.
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const slot = slots[index];
      if (!slot) {
        setLocalError("Couldn't upload those files. Try again.");
        return null;
      }

      // Content-Type is set explicitly rather than left to the browser:
      // R2 stores whatever arrives, and an attachment saved as
      // application/octet-stream is one a <video> tag refuses to play.
      // Safe to send — the presigned URL signs `host` alone, so headers
      // beyond it are never part of the signature.
      let response: Response;
      try {
        response = await fetch(slot.url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        // A CORS rejection and a dropped connection are the same thing
        // from here: fetch throws without saying which.
        setLocalError(`${file.name} didn't upload. Check your connection.`);
        return null;
      }

      if (!response.ok) {
        console.error("R2 upload failed", response.status, await response.text().catch(() => ""));
        setLocalError(`${file.name} didn't upload. Try again.`);
        return null;
      }

      attached.push({ path: slot.key, mime: file.type, size: file.size });
    }

    return attached;
  }

  async function submit() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;

    setLocalError(null);
    setState(initial);
    setUploading(true);
    const attached = await uploadAll();
    setUploading(false);
    if (!attached) return;

    const data = new FormData(form);
    data.set("media", JSON.stringify(attached));

    // Inside a transition so the revalidated list below arrives with the
    // result, and awaited so the form can be emptied the moment it lands —
    // the next thing someone does after writing up Monday is write up
    // Tuesday.
    startPosting(async () => {
      const result = await postContribution(initial, data);
      setState(result);
      if (result.posted) {
        form.reset();
        setFiles([]);
      }
    });
  }

  const busy = uploading || posting;
  const error = localError ?? state.error;

  return (
    <form
      className="space-y-5 rounded-2xl border border-accent/30 bg-accent/[0.04] p-6"
      ref={formRef}
    >
      <div>
        <h2 className="text-sm font-semibold">Add what you did</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Write it up while it&apos;s fresh. It sits as pending until someone
          checks it, and only then does it count.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">What did you do?</Label>
        <Input id="title" maxLength={140} name="title" required />
        <p className="text-xs text-muted-foreground">
          The only part that&apos;s required.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">What result came out of it?</Label>
        <Textarea className="min-h-32" id="body" maxLength={8000} name="body" />
        <p className="text-xs text-muted-foreground">
          Optional, but worth the two minutes — this is what a reviewer reads
          to say yes, so entries with it get approved fastest. Links are fine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Kind of work</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            defaultValue="marketing"
            id="category"
            name="category"
          >
            {CONTRIBUTION_CATEGORIES.map((entry) => (
              <option
                className="bg-[#0b1120]"
                key={entry.value}
                value={entry.value}
              >
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occurredOn">Day you did it</Label>
          <Input
            defaultValue={today}
            id="occurredOn"
            max={today}
            name="occurredOn"
            required
            type="date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Roughly how long</Label>
          <Input
            id="hours"
            inputMode="decimal"
            max={999}
            min={0}
            name="hours"
            step="0.25"
            type="number"
          />
          <p className="text-xs text-muted-foreground">Hours. Optional.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Anything to show for it</Label>
        <input
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          className="hidden"
          multiple
          onChange={(event) => addFiles(event.target.files)}
          ref={fileRef}
          type="file"
        />
        <button
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
            files.length >= MAX_MEDIA_PER_CONTRIBUTION &&
              "pointer-events-none opacity-50"
          )}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <Paperclip className="h-4 w-4" />
          Add screenshots, a recording, a file
        </button>
        <p className="text-xs text-muted-foreground">
          Optional, but recommended — a screenshot is the quickest way for a
          reviewer to see it&apos;s done. Up to {MAX_MEDIA_PER_CONTRIBUTION}{" "}
          files, {formatBytes(MAX_MEDIA_BYTES)} each.
        </p>

        {files.length > 0 && (
          <ul className="space-y-2 pt-1">
            {files.map((file, index) => (
              <li
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                key={`${file.name}-${index}`}
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  disabled={busy}
                  onClick={() =>
                    setFiles(files.filter((_, other) => other !== index))
                  }
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {state.posted && !error && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Posted. It&apos;s waiting to be checked.
        </p>
      )}

      <Button className="w-full sm:w-auto" disabled={busy} onClick={submit} type="button">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {uploading
          ? "Uploading…"
          : posting
            ? "Posting…"
            : "Post this contribution"}
      </Button>
    </form>
  );
}
