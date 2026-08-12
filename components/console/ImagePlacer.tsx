"use client";

import { useRef, useState } from "react";

/**
 * Drag the picture to say which part of it should stay in view.
 *
 * A background image is drawn `cover`-centred, which throws away
 * whatever falls outside the crop. For a photo composed for that crop
 * it is fine; for anything else the subject ends up off the edge with
 * no way to say so. Dragging here sets a focal point, and the zoom
 * scales the image up inside the same frame.
 *
 * The focal point is stored as a PERCENTAGE, because the card is a
 * different size on every phone and this frame is a different size
 * again — a pixel offset would mean something different everywhere it
 * was drawn. A percentage means "keep this part of the picture in
 * view", which is the instruction actually being given.
 *
 * The frame is the card's real aspect ratio, so what is inside it is
 * what a phone shows.
 */
export function ImagePlacer({
  url,
  zoom,
  focusX,
  focusY,
  aspect,
  disabled = false,
  onFocus,
}: {
  url: string;
  zoom: number;
  focusX: number;
  focusY: number;
  /** width / height of the card being previewed. */
  aspect: number;
  /** Shown but inert — the layout in use doesn't crop, so there is
   * nothing to position. Visible rather than hidden so the control is
   * findable before the layout is switched. */
  disabled?: boolean;
  onFocus: (x: number, y: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromPointer = (clientX: number, clientY: number) => {
    if (disabled) return;
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    // Clamped: dragging past the edge should stop at the edge rather
    // than storing a focal point outside the picture.
    const x = Math.round(
      Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)),
    );
    const y = Math.round(
      Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100)),
    );
    onFocus(x, y);
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-white/15 bg-black/30 select-none ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-move"
        }`}
        onPointerDown={(event) => {
          // Pointer capture, so a drag that leaves the frame keeps
          // tracking instead of stopping dead at the border.
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          setFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (dragging) setFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        ref={frame}
        style={{ aspectRatio: aspect }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="pointer-events-none h-full w-full object-cover"
            draggable={false}
            src={url}
            style={{
              objectPosition: `${focusX}% ${focusY}%`,
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Upload an image to place it
          </div>
        )}

        {/* The crosshair marks where the focal point sits, so it is
            visible even on an image with no obvious subject. */}
        {url ? (
          <span
            aria-hidden
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow"
            style={{ left: `${focusX}%`, top: `${focusY}%` }}
          />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {disabled
          ? "Positioning applies to the fills-the-card layout."
          : `Drag to choose what stays in view · ${focusX}% / ${focusY}%`}
      </p>
    </div>
  );
}
