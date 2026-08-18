import { AwsClient } from "aws4fetch";
import { NextResponse } from "next/server";

import { hasConsoleSession } from "@/lib/console/session";

/**
 * Banner artwork upload.
 *
 * A route handler rather than a server action, and that is the whole
 * point of it. Submitting a server action makes Next re-render the
 * route's server components and hand back a fresh RSC payload — which
 * collapsed the `<details>` the banner was being edited inside and
 * remounted the form, losing every unsaved field. Uploading a picture
 * should not cost someone the copy they just wrote.
 *
 * A plain `fetch` from the client touches none of that: it returns a
 * URL, the form puts it in state, and nothing else on the page moves.
 *
 * It lives UNDER `/console` on purpose. The operator cookie is scoped
 * `path: "/console"`, so a handler at `/api/...` never receives it and
 * every upload came back "Not signed in." Widening the cookie to `/`
 * would have fixed the symptom by sending an operator session to every
 * public page on the site — the wrong trade for a file upload. Moving
 * the route keeps the cookie's scope exactly as narrow as it was, and
 * the middleware's `/console/:path*` matcher now guards it too.
 *
 * Auth is still checked here rather than by `requireConsole`, which
 * `redirect()`s — correct for a page, useless for a POST that wants a
 * status code back.
 *
 * ARTWORK NOW GOES TO CLOUDFLARE R2, not Supabase Storage. Banners are
 * the app's highest-traffic images by a distance: a handful of objects
 * downloaded by every user on the home and discover screens. On Supabase
 * every one of those downloads was billed egress against a 5 GB monthly
 * allowance; R2 charges nothing for egress at any volume and caches the
 * same few objects at Cloudflare's edge, which is the ideal shape for
 * this workload. See docs/STORAGE_MIGRATION.md in the app repo.
 *
 * Nothing in the mobile app changed for this. `promo_banners.image_url`
 * holds a complete URL and the app renders whatever it finds there, so
 * banners uploaded before this change keep serving from Supabase under
 * their old URLs and no migration was needed.
 *
 * The upload is signed here, server-side, rather than through the app's
 * `storage-sign` edge function. That function mints keys scoped to the
 * calling user's own folder, which is right for a Hustler uploading their
 * own avatar and wrong for an operator publishing a banner that belongs
 * to nobody.
 */

/** A banner is drawn at most a phone-width wide, so anything past a
 * few megabytes is a photo nobody downsized first. */
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Sits alongside `avatars/` and `skills/`, which the app writes. */
const PREFIX = "promo";

export async function POST(request: Request) {
  if (!(await hasConsoleSession())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image first." }, { status: 400 });
  }
  if (!TYPES.includes(file.type)) {
    return NextResponse.json({ error: "JPEG, PNG or WebP only." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is over 4MB — resize it first." },
      { status: 400 },
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    // Loud rather than quietly falling back to Supabase Storage: a banner
    // that silently lands in the wrong bucket is a URL nobody can explain
    // six months later.
    return NextResponse.json(
      { error: "Artwork storage is not configured." },
      { status: 500 },
    );
  }

  const ext = extensionFor(file.type);
  // Random name, not the original: two operators uploading `banner.jpg`
  // must not overwrite each other, and a filename off someone's desktop
  // does not belong in a public URL.
  const key = `${PREFIX}/${crypto.randomUUID()}.${ext}`;

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const response = await client.fetch(
    `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`,
    {
      method: "PUT",
      body: await file.arrayBuffer(),
      headers: { "Content-Type": file.type },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: `Upload failed (${response.status}).` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: `${publicBase.replace(/\/$/, "")}/${key}`,
  });
}

/** Derived from the validated MIME type rather than the uploaded
 * filename, which is attacker-controlled and often just wrong. */
function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}
