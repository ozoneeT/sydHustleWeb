"""
Bakes the hero's device glow to a PNG.

The reference ships this as artwork (`hero-phone-light.png`) rather than
CSS, and that is not a stylistic choice — a `filter: blur()` inside a
transform-scaled element has to be re-rasterised on every frame of the
zoom, which makes the device flicker. A bitmap scales as a texture.

The light is a horizon, not an outline. The reference puts a single wide,
shallow source behind the device's top edge, so what you see is a band of
sky above the shoulders that falls off sideways into the ground — the
sides and bottom of the device are unlit. Tracing the silhouette instead,
however softly, is what makes a device read as a sticker pasted on the
page.

That shape is also the only one that survives the zoom. The hero scales
this texture past 6x, so the artwork must contain no hard edges at all:
a rim light against the silhouette gives a bright pixel next to a
transparent one, which upscales into a visible staircase, and a
silhouette cut with a circular corner will not sit exactly under a CSS
corner rounded elliptically (13% / 6%) — the cut edge then shows past
the frame. A single smooth gaussian has neither problem, and the device
is opaque, so the part of the streak behind it simply never shows.
"""
import math, struct, zlib

W, H = 512, 1024                   # half-res; a gaussian upscales cleanly
DEV_W = 168                        # device width inside the image
DEV_H = DEV_W * 19.5 / 9
CX, CY = W / 2, H / 2
TOP = CY - DEV_H / 2               # the device's top edge

# The source sits just below the top edge, inside the device's
# silhouette, so the device clips the bottom of the hot core and what
# clears the bezel is a bright crescent rather than a full lamp. Sitting
# it exactly on the edge spills the whole white centre up the page;
# burying it much deeper than this hides the white altogether and leaves
# only a flat teal wash, which is the duller failure of the two.
SRC_Y = TOP + DEV_W * 0.06

# Wide and shallow: the light spreads along the shoulders far more than
# it climbs, which is what makes it read as a horizon behind the device
# rather than a halo around it.
SIGMA_X = DEV_W * 0.36
SIGMA_Y = DEV_W * 0.22

# A small white-hot core easing out through the brand teal into a deep
# blue-green that meets the page's own black.
CORE_RGB = (226, 255, 250)
MID_RGB = (45, 212, 191)
FAR_RGB = (8, 62, 70)

PEAK = 0.95


def smoothstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def mix(c0, c1, t):
    return tuple(c0[i] + (c1[i] - c0[i]) * t for i in range(3))


rows = []
for y in range(H):
    row = bytearray()
    dy = (y - SRC_Y) / SIGMA_Y
    ey = dy * dy
    for x in range(W):
        dx = (x - CX) / SIGMA_X
        i = math.exp(-(dx * dx + ey) / 2)
        a = i * PEAK
        if a < 0.004:
            row += b"\0\0\0\0"
            continue
        if i > 0.80:
            rgb = mix(MID_RGB, CORE_RGB, smoothstep(0.80, 0.995, i))
        else:
            rgb = mix(FAR_RGB, MID_RGB, smoothstep(0.02, 0.80, i))
        row += bytes((round(rgb[0]), round(rgb[1]), round(rgb[2]), round(a * 255)))
    rows.append(bytes(row))

raw = b"".join(b"\0" + r for r in rows)

def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(raw, 9))
       + chunk(b"IEND", b""))

import os
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "public", "hero-glow.png")
open(out, "wb").write(png)
print(out, len(png), "bytes", W, "x", H, "device", DEV_W, round(DEV_H))
