import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getTeamActor } from "@/lib/team/dal";
import { r2Config, presignUpload, TEAM_PREFIX } from "@/lib/team/r2";
import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_CONTRIBUTION,
  isAllowedMediaType,
} from "@/lib/team/media";

export const dynamic = "force-dynamic";

/**
 * Hands out one-time upload URLs so evidence goes straight from the
 * member's phone to Cloudflare R2.
 *
 * The files do not pass through this app at all, and that is the reason
 * this route exists instead of a Server Action taking the FormData: an
 * action request is capped at 1MB by default and a serverless function
 * body at a few megabytes, and a screen recording is neither. Signing an
 * upload URL is a few hundred bytes in each direction no matter how big
 * the file is.
 *
 * What the caller gets is narrow on purpose. The key is chosen here, not
 * by the client, and always begins with the member's own id — so a
 * presigned URL can only ever write to that one object, and the same
 * prefix is checked again when the file is attached to a claim.
 *
 * NOTE: R2 needs a CORS rule allowing PUT from this site's origin, or the
 * browser refuses the upload before it is ever sent. See the team ledger
 * section of the README.
 */

interface RequestedFile {
  name?: unknown;
  mime?: unknown;
  size?: unknown;
}

/** A short, boring extension taken from the client's filename. The name
 * itself is never used as the key — it is attacker-controlled text. */
function extensionOf(name: string): string {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(name.trim());
  return match ? `.${match[1].toLowerCase()}` : "";
}

export async function POST(request: Request) {
  const member = await getTeamActor();
  if (!member) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const config = r2Config();
  if (!config) {
    // Loud rather than quietly falling back to another bucket: evidence
    // that lands somewhere public is not a degraded upload, it's a leak.
    console.error("R2 is not configured — refusing to issue upload URLs.");
    return NextResponse.json(
      { error: "File storage isn't set up on this deployment." },
      { status: 500 }
    );
  }

  let body: { files?: RequestedFile[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files." }, { status: 400 });
  }
  if (files.length > MAX_MEDIA_PER_CONTRIBUTION) {
    return NextResponse.json(
      { error: `Up to ${MAX_MEDIA_PER_CONTRIBUTION} files per entry.` },
      { status: 400 }
    );
  }

  const slots: { key: string; url: string }[] = [];

  for (const file of files) {
    const name = typeof file.name === "string" ? file.name : "";
    const mime = typeof file.mime === "string" ? file.mime : "";
    const size = typeof file.size === "number" ? file.size : -1;

    if (!isAllowedMediaType(mime)) {
      return NextResponse.json(
        { error: "Photos, video, audio and PDFs only." },
        { status: 400 }
      );
    }
    if (size < 0 || size > MAX_MEDIA_BYTES) {
      return NextResponse.json(
        { error: "That file is too big — 25MB is the limit." },
        { status: 400 }
      );
    }

    const key = `${TEAM_PREFIX}/${member.id}/${randomUUID()}${extensionOf(name)}`;
    slots.push({ key, url: await presignUpload(config, key) });
  }

  return NextResponse.json({ slots });
}
