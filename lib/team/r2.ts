import "server-only";

import { AwsClient } from "aws4fetch";

/**
 * Contribution evidence lives in Cloudflare R2, not Supabase Storage.
 *
 * Supabase's free tier gives 1GB of storage and meters egress; screen
 * recordings at 25MB each would eat that in an afternoon, and every review
 * of one is billed egress on top. R2 charges nothing for egress at any
 * volume, and the account already has a bucket and a token for promo
 * artwork — see app/console/api/promo-art/route.ts.
 *
 * IT IS THE SAME BUCKET AS PROMO ARTWORK, under a `team/` prefix rather
 * than `promo/`. That bucket is served publicly at R2_PUBLIC_BASE_URL, so
 * ATTACHMENTS HERE ARE READABLE BY ANYONE WHO HAS THE URL. Keys are random
 * UUIDs, so a URL cannot be guessed or walked — but it can be forwarded,
 * and it does not expire.
 *
 * That is a deliberate trade for a ledger meant to run for a few months:
 * no second bucket, no second token, no presigning on every page render,
 * and the files come off Cloudflare's edge cache. If this outlives its
 * welcome — or somebody starts attaching screenshots of the books — the
 * way back is a private bucket with no public domain bound to it, plus
 * `presignDownload` in place of `publicUrl` below. Nothing else changes:
 * `storage_path` already holds a plain object key.
 */

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
}

/** Sits alongside `promo/`, `avatars/` and `skills/` in the same bucket. */
export const TEAM_PREFIX = "team";

/** Long enough for a 25MB video off a phone on a bad connection. The clock
 * runs to the START of the upload, not its end, so this is patience before
 * someone presses the button rather than a transfer deadline. */
const UPLOAD_TTL_SECONDS = 30 * 60;

export function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

function client(config: R2Config): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    // R2 has no regions, but SigV4 requires one in the credential scope
    // and "auto" is what Cloudflare's own examples sign with.
    region: "auto",
  });
}

/** The S3 API address of an object — for writing and deleting only.
 * Readers use `publicUrl`. */
function objectUrl(config: R2Config, key: string): string {
  // Each segment is encoded, the slashes between them are not — an object
  // key is a path to R2, not one opaque name.
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${path}`;
}

/** Where a reader finds the object, through the bucket's public domain. */
export function publicUrl(config: R2Config, key: string): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${config.publicBase.replace(/\/$/, "")}/${path}`;
}

/**
 * A one-time URL the browser can PUT a file to.
 *
 * Uploading is never public even though reading is, so this is signed.
 * No headers are signed beyond `host`, on purpose: the browser adds its
 * own `Content-Length` to a `fetch` with a File body, and signing values
 * we would then have to predict exactly is how these fail with an
 * unreadable SignatureDoesNotMatch. R2 stores whatever `Content-Type`
 * arrives, which the composer sets explicitly.
 */
export async function presignUpload(
  config: R2Config,
  key: string
): Promise<string> {
  const url = new URL(objectUrl(config, key));
  url.searchParams.set("X-Amz-Expires", String(UPLOAD_TTL_SECONDS));

  const signed = await client(config).sign(url.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });
  return signed.url;
}

/**
 * Removes objects, one request each.
 *
 * S3's batch delete is a signed POST with an XML body and a Content-MD5
 * header, which is a lot of surface for the handful of files one withdrawn
 * contribution can have. Failures are reported, never thrown: by the time
 * this runs the row is already gone, and a file left behind is untidy
 * rather than broken.
 */
export async function deleteObjects(
  config: R2Config,
  keys: string[]
): Promise<void> {
  const aws = client(config);
  await Promise.all(
    keys.map(async (key) => {
      try {
        const response = await aws.fetch(objectUrl(config, key), {
          method: "DELETE",
        });
        // R2 answers 204 for a delete, and 404 for one that was already
        // gone — which is the outcome we wanted either way.
        if (!response.ok && response.status !== 404) {
          console.error("R2 delete failed", key, response.status);
        }
      } catch (err) {
        console.error("R2 delete threw", key, err);
      }
    })
  );
}
