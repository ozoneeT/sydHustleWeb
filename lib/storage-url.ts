/**
 * Putting sydHustle's own name on the Supabase Storage URLs the console
 * hands out.
 *
 * The private buckets - certification documents, appeal evidence - are
 * read here with the service role and shown to a reviewer through
 * short-lived signed URLs. `createSignedUrls` builds those from whatever
 * the client was configured with, so opening a licence photo from the
 * queue put `<project>.supabase.co` in the address bar.
 *
 * A Cloudflare Worker on `files.sydhustle.com` forwards the storage read
 * paths to Supabase unchanged. The token in a signed URL is a JWT over
 * the OBJECT PATH rather than the host, so the same URL verifies
 * identically whichever door it arrives at - which is what makes this a
 * rename rather than a second access-control system to keep in step with
 * the first. The Worker lives in the mobile app repo, at
 * `cloudflare/files-proxy/`, because that is where the same rewrite is
 * applied for the app's own copy of these screens.
 *
 * Unset means unchanged. With no `NEXT_PUBLIC_STORAGE_BASE_URL` the raw
 * Supabase URL is returned, so a deploy that lands before the Worker
 * does still works.
 */

const SUPABASE_ORIGIN = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL);
const BRANDED_ORIGIN = trimTrailingSlash(
  process.env.NEXT_PUBLIC_STORAGE_BASE_URL,
);

/** Only the read paths. The proxy is deliberately GET-only. */
const STORAGE_PREFIX = "/storage/v1/";

export function brandStorageUrl(url: string | null): string | null {
  if (!url || !SUPABASE_ORIGIN || !BRANDED_ORIGIN) return url;
  // Anything already on our own domains - a `cdn.sydhustle.com` avatar,
  // a Google profile picture from social sign-in - is left exactly as it
  // is. Only this project's storage host is rewritten.
  if (!url.startsWith(`${SUPABASE_ORIGIN}${STORAGE_PREFIX}`)) return url;
  return `${BRANDED_ORIGIN}${url.slice(SUPABASE_ORIGIN.length)}`;
}

function trimTrailingSlash(value: string | undefined): string | null {
  if (!value) return null;
  return value.replace(/\/+$/, "");
}
