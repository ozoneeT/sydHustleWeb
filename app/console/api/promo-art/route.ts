import { NextResponse } from "next/server";

import { hasConsoleSession } from "@/lib/console/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
 */

/** A banner is drawn at most a phone-width wide, so anything past a
 * few megabytes is a photo nobody downsized first. */
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  const supabase = createServerSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  // Random name, not the original: two operators uploading `banner.jpg`
  // must not overwrite each other, and a filename off someone's desktop
  // does not belong in a public URL.
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("promo-art")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("promo-art").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
