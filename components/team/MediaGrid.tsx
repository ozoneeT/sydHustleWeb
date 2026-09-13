import { FileText, Paperclip } from "lucide-react";

import { formatBytes } from "@/lib/team/media";
import type { ContributionMedia } from "@/lib/team/data";

/**
 * Evidence attached to a contribution, shown the same way on both sides of
 * the review — one component so a member can never be looking at
 * something different from the person judging it.
 *
 * The URLs point straight at the bucket's public domain, so they are
 * stable and edge-cached rather than expiring — see lib/team/r2.ts for
 * what that trades away. A missing one means R2 isn't configured, not that
 * a link went stale.
 */
export function MediaGrid({ media }: { media: ContributionMedia[] }) {
  if (media.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {media.map((file) => {
        const type = file.mime_type.toLowerCase();

        if (!file.url) {
          return (
            <li
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-muted-foreground"
              key={file.id}
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              Attachment unavailable — reload the page.
            </li>
          );
        }

        if (type.startsWith("image/")) {
          return (
            <li key={file.id}>
              <a href={file.url} rel="noreferrer" target="_blank">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-44 w-full rounded-xl border border-white/10 object-cover transition-opacity hover:opacity-90"
                  src={file.url}
                />
              </a>
            </li>
          );
        }

        if (type.startsWith("video/")) {
          return (
            <li key={file.id}>
              <video
                className="h-44 w-full rounded-xl border border-white/10 bg-black object-contain"
                controls
                preload="metadata"
                src={file.url}
              />
            </li>
          );
        }

        if (type.startsWith("audio/")) {
          return (
            <li
              className="rounded-xl border border-white/10 bg-white/5 p-3"
              key={file.id}
            >
              <audio className="w-full" controls preload="metadata" src={file.url} />
            </li>
          );
        }

        return (
          <li key={file.id}>
            <a
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm transition-colors hover:bg-white/10"
              href={file.url}
              rel="noreferrer"
              target="_blank"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">Open attachment</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(file.size_bytes)}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
