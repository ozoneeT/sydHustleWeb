import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site";

/**
 * The picture that shows up when somebody shares sydhustle.com.
 *
 * It exists because the old one was the bare wordmark PNG, and that was
 * two separate faults in one image. The artwork has a TRANSPARENT
 * background, so WhatsApp — like every other client that flattens a
 * preview — composited it onto white, and the white half of the lock-up
 * ("syd") disappeared, leaving "Hustle" floating on nothing. And it is
 * 1054 × 367, nearly 3:1, so a card expecting 1.91:1 cropped the ends off
 * and blew the middle up to fill the space.
 *
 * So: an opaque 1200 × 630 canvas, painted in the site's own navy, with
 * the dark-background lock-up sitting on it at a size that survives a
 * thumbnail. Opaque is the whole point — nothing downstream gets to decide
 * what colour sits behind the logo.
 *
 * No text is drawn. Satori needs a real font file for that, which would
 * mean either committing a TTF or fetching one from Google at build time,
 * and a build that can fail because a font CDN is slow is a bad trade for
 * a line of copy the preview card already prints for itself underneath.
 */

export const alt = `${SITE_NAME} — get it done by someone nearby`;

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default async function OpenGraphImage() {
  // The dark-background variant: white "syd", teal "Hustle". The light one
  // would vanish into the navy exactly the way the dark one vanished into
  // WhatsApp's white.
  const logo = await readFile(
    join(process.cwd(), "public", "sydhustle-logo-dark.png")
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The site's own ground and the same teal horizon as the hero,
          // so a shared link looks like the page it opens.
          backgroundColor: "#0b1120",
          backgroundImage:
            "radial-gradient(1100px 560px at 15% -10%, rgba(45,212,191,0.22), rgba(11,17,32,0) 60%)",
        }}
      >
        {/* 720px wide on a 1200px canvas: big enough to read as a brand at
            the ~200px thumbnail a chat list shows, with enough air left
            that nothing touches the edges when a client crops it. */}
        <img alt="" src={logoSrc} width={720} height={251} />
      </div>
    ),
    size
  );
}
