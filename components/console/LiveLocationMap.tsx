"use client";

import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * The Location desk's live map: the venue pin plus both parties' latest
 * broadcast positions for one Hustle session, updating as the messages
 * arrive on the session's realtime channel (`hustle-live:<conversationId>`
 * — the same channel the two apps' live activity cards ride on).
 *
 * Positions arrive ONLY while the participants' apps are running their
 * live cards; a marker that stops moving means the app behind it went
 * quiet, and the "last seen" stamps say exactly when. For a finished
 * session, the recorded final positions are plotted instead of live ones.
 */

declare global {
  interface Window {
    /** Present once the loader below has injected the Maps script. */
    google?: typeof google;
  }
}

type LiveBroadcast = {
  role: "traveller" | "host";
  profileId: string;
  lat: number;
  lng: number;
  remainingMeters?: number;
  etaSeconds?: number | null;
  progress?: number;
  arrived?: boolean;
};

export type MapPin = {
  role: "traveller" | "host" | "venue" | "final";
  label: string;
  lat: number;
  lng: number;
};

const BRAND_TEAL = "#14B8A6";
const HOST_INK = "#0F2E2E";
const PANIC_RED = "#EF4444";

/** One shared loader promise — the API script must only be injected once,
 * however many maps mount. */
let mapsReady: Promise<typeof google> | null = null;

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    return new Promise(() => {});
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (mapsReady) return mapsReady;

  mapsReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.onerror = () => {
      mapsReady = null;
      reject(new Error("Google Maps failed to load"));
    };
    script.onload = () => resolve(window.google);
    document.head.appendChild(script);
  });
  return mapsReady;
}

function formatDistance(meters: number): string {
  return meters >= 950
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.max(10, Math.round(meters / 10) * 10)} m`;
}

function pinIcon(role: MapPin["role"]): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: role === "venue" ? 7 : 9,
    fillColor:
      role === "traveller"
        ? BRAND_TEAL
        : role === "host"
          ? HOST_INK
          : role === "final"
            ? PANIC_RED
            : "#FFFFFF",
    fillOpacity: 1,
    strokeColor: role === "venue" ? HOST_INK : "#FFFFFF",
    strokeWeight: 2.5,
  };
}

export function LiveLocationMap({
  conversationId,
  live,
  pins,
  travellerName,
  hostName,
}: {
  conversationId: string;
  /** False for a finished session: plot `pins` statically, no channel. */
  live: boolean;
  /** Initial pins: always the venue; final positions when not live. */
  pins: MapPin[];
  travellerName: string;
  hostName: string;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const fittedRef = useRef(false);

  const [mapError, setMapError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<{
    role: "traveller" | "host";
    at: number;
    remainingMeters?: number;
    etaSeconds?: number | null;
    arrived?: boolean;
  } | null>(null);
  const [seenAt, setSeenAt] = useState<{ traveller?: number; host?: number }>(
    {},
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // The map itself, plus the static pins.
  useEffect(() => {
    // Missing key renders its own placeholder below — no map to build.
    if (!apiKey) return;

    const markers = markersRef.current;
    let cancelled = false;
    void loadGoogleMaps(apiKey)
      .then((g) => {
        if (cancelled || !mapNodeRef.current) return;

        const fallback = pins[0] ?? { lat: 7.3775, lng: 3.947 }; // Ibadan
        const map = new g.maps.Map(mapNodeRef.current, {
          center: { lat: fallback.lat, lng: fallback.lng },
          zoom: 15,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        mapRef.current = map;

        const bounds = new g.maps.LatLngBounds();
        pins.forEach((pin, index) => {
          const marker = new g.maps.Marker({
            map,
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.label,
            icon: pinIcon(pin.role),
            label:
              pin.role === "venue"
                ? undefined
                : {
                    text: pin.label,
                    className: "syd-map-label",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "700",
                  },
          });
          markers.set(`${pin.role}:${index}`, marker);
          bounds.extend({ lat: pin.lat, lng: pin.lng });
        });
        if (pins.length > 1) {
          map.fitBounds(bounds, 80);
          fittedRef.current = true;
        }
      })
      .catch(() => setMapError("Google Maps failed to load."));

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      mapRef.current = null;
    };
    // Static per page load: the pins are server-rendered props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // The live subscription — one marker per role, moved on each broadcast.
  useEffect(() => {
    if (!live) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`hustle-live:${conversationId}`)
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        const update = payload as Partial<LiveBroadcast>;
        if (
          (update.role !== "traveller" && update.role !== "host") ||
          typeof update.lat !== "number" ||
          typeof update.lng !== "number"
        ) {
          return;
        }

        const g = window.google;
        const map = mapRef.current;
        if (!g?.maps || !map) return;

        const key = `live:${update.role}`;
        const position = { lat: update.lat, lng: update.lng };
        const existing = markersRef.current.get(key);
        if (existing) {
          existing.setPosition(position);
        } else {
          markersRef.current.set(
            key,
            new g.maps.Marker({
              map,
              position,
              title: update.role === "traveller" ? travellerName : hostName,
              icon: pinIcon(update.role),
              label: {
                text: update.role === "traveller" ? travellerName : hostName,
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: "700",
              },
              zIndex: update.role === "traveller" ? 3 : 2,
            }),
          );
          // First live fix: bring both ends of the journey into view once,
          // then leave the camera to the operator.
          if (!fittedRef.current) {
            const bounds = new g.maps.LatLngBounds();
            markersRef.current.forEach((marker) => {
              const at = marker.getPosition();
              if (at) bounds.extend(at);
            });
            map.fitBounds(bounds, 80);
            fittedRef.current = true;
          }
        }

        setSeenAt((prev) => ({ ...prev, [update.role!]: Date.now() }));
        if (update.role === "traveller") {
          setLastUpdate({
            role: "traveller",
            at: Date.now(),
            remainingMeters: update.remainingMeters,
            etaSeconds: update.etaSeconds,
            arrived: update.arrived,
          });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [live, conversationId, travellerName, hostName]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-white"
            style={{ backgroundColor: BRAND_TEAL }}
          />
          {travellerName} (travelling)
          {seenAt.traveller ? (
            <span className="text-muted-foreground">
              · seen {new Date(seenAt.traveller).toLocaleTimeString()}
            </span>
          ) : live ? (
            <span className="text-muted-foreground">· waiting for signal</span>
          ) : null}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-white"
            style={{ backgroundColor: HOST_INK }}
          />
          {hostName} (hosting)
          {seenAt.host ? (
            <span className="text-muted-foreground">
              · seen {new Date(seenAt.host).toLocaleTimeString()}
            </span>
          ) : null}
        </span>
        {lastUpdate ? (
          <span className="font-semibold" style={{ color: BRAND_TEAL }}>
            {lastUpdate.arrived
              ? "Arrived at the venue"
              : [
                  typeof lastUpdate.remainingMeters === "number"
                    ? `${formatDistance(lastUpdate.remainingMeters)} out`
                    : null,
                  typeof lastUpdate.etaSeconds === "number" &&
                  lastUpdate.etaSeconds > 0
                    ? `ETA ${Math.max(1, Math.round(lastUpdate.etaSeconds / 60))} min`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </span>
        ) : null}
      </div>

      {mapError ? (
        <div className="flex h-[480px] items-center justify-center rounded-xl border border-white/10 text-sm text-muted-foreground">
          {mapError}
        </div>
      ) : (
        <div
          className="h-[480px] w-full overflow-hidden rounded-xl border border-white/10"
          ref={mapNodeRef}
        />
      )}

      {live ? (
        <p className="text-xs text-muted-foreground">
          Markers move only while a participant&apos;s app is broadcasting —
          a still marker means their app went quiet, and the &quot;seen&quot;
          stamp is the last word from it.
        </p>
      ) : null}
    </div>
  );
}
