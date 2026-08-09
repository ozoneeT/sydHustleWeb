"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  revealIdentityRecord,
  type RevealState,
} from "@/lib/console/identity-actions";

type IdentityRevealProps = {
  profileId: string;
  label: string;
};

const INITIAL: RevealState = { error: null, record: null };

type EmbeddedImage = {
  /** Where it sat in the payload, e.g. `registered.signature`. */
  path: string;
  title: string;
  dataUri: string;
  kb: number;
};

/** NIMC's field names, as a person would read them. Anything not listed
 * falls back to the key itself, so a new field still gets a sane label
 * instead of being dropped. */
const IMAGE_TITLES: Record<string, string> = {
  image: "Photograph",
  photo: "Photograph",
  signature: "Signature",
};

function titleFor(key: string): string {
  if (IMAGE_TITLES[key]) return IMAGE_TITLES[key];
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Lifts every embedded image out of the JSON, wherever it sits.
 *
 * NIMC returns the portrait and the signature inline as base64 data
 * URIs — tens of thousands of characters that push every other field off
 * the screen and tell a human nothing. In a fraud or police case these
 * are often the most useful fields in the record, so they are shown as
 * pictures and the JSON keeps a placeholder noting each one's size.
 *
 * Deliberately a walk of the whole payload rather than a lookup of
 * `image` and `signature`: NIMC is already inconsistent about which it
 * returns (one of these records has a signature, the other doesn't), so
 * a fixed list would silently miss whatever it starts sending next.
 *
 * Nothing is discarded — the stored record is untouched, this only
 * changes how it is displayed.
 */
function extractImages(payload: unknown): {
  images: EmbeddedImage[];
  rest: unknown;
} {
  const images: EmbeddedImage[] = [];

  function walk(node: unknown, path: string): unknown {
    if (typeof node === "string") {
      if (!node.startsWith("data:image/")) return node;
      // Size the decoded bytes, not the data-URI header, so the note is
      // about the picture rather than the encoding.
      const base64 = node.slice(node.indexOf(",") + 1);
      const kb = Math.max(1, Math.round((base64.length * 3) / 4 / 1024));
      const key = path.split(".").pop() ?? path;
      const title = titleFor(key);
      images.push({ path, title, dataUri: node, kb });
      return `[${title.toLowerCase()} shown above — ~${kb} KB]`;
    }

    if (Array.isArray(node)) {
      return node.map((item, index) => walk(item, `${path}[${index}]`));
    }

    if (node !== null && typeof node === "object") {
      return Object.fromEntries(
        Object.entries(node as Record<string, unknown>).map(([key, value]) => [
          key,
          walk(value, path ? `${path}.${key}` : key),
        ])
      );
    }

    return node;
  }

  return { images, rest: walk(payload, "") };
}

/**
 * The reveal control: a reason, then the record.
 *
 * Collapsed by default and one row at a time. Opening a NIMC record —
 * name, date of birth, registered address, phone, photograph — is not
 * something to do by scrolling past it, so the reason box is the thing
 * that appears first and the plaintext only exists after it is filled.
 */
export function IdentityReveal({ profileId, label }: IdentityRevealProps) {
  const [state, action, pending] = useActionState(
    revealIdentityRecord,
    INITIAL
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        Open record
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input name="profileId" type="hidden" value={profileId} />
        <Input
          className="w-72"
          maxLength={500}
          name="reason"
          placeholder="Reason — case, dispute or request ref"
          required
        />
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Opening…" : "Reveal"}
        </Button>
        <Button
          onClick={() => setOpen(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        This is logged against {label} with the reason you type, permanently
        and uneditably.
      </p>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      {state.record ? (
        <RecordView record={state.record} />
      ) : null}
    </div>
  );
}

function RecordView({
  record,
}: {
  record: NonNullable<RevealState["record"]>;
}) {
  const { images, rest } = extractImages(record.payload);

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        Disclosed and logged · not stored anywhere on this page
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
        <Meta label="Provider" value={record.provider} />
        <Meta label="Provider ref" value={record.providerRef} />
        <Meta label="Verified" value={record.verifiedAt} />
        <Meta label="Purge after" value={record.purgeAfter} />
      </dl>

      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-4">
            {images.map((image) => (
              <figure className="space-y-1" key={image.path}>
                {/* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URI from the record; there is no URL for the optimiser to fetch */}
                <img
                  alt={`${image.title} on the national identity record`}
                  className="max-h-36 rounded-md border border-white/15 bg-white/5 object-contain"
                  src={image.dataUri}
                />
                <figcaption className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {image.title} · {image.path} · ~{image.kb} KB
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Held by NIMC for this person. Shown here rather than printed into
            the JSON below, where each was tens of thousands of characters of
            base64.
          </p>
        </div>
      ) : null}

      {/* `whitespace-pre-wrap` keeps the JSON indentation while letting lines
          wrap, and `break-words` splits any single token too long for a line
          — without it one long value scrolls the whole record sideways. */}
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/40 p-3 text-xs leading-relaxed text-white/90">
        {JSON.stringify(rest, null, 2)}
      </pre>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide">{label}</dt>
      <dd className="text-white/80">{value ?? "—"}</dd>
    </div>
  );
}
