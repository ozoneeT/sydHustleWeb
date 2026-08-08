"use client";

import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * The Location desk's live map — three points, always.
 *
 * A session has three independent positions: the Hustler, the Provider,
 * and the Hustle itself. The venue is NOT wherever the host is standing:
 * a Provider posts a Hustle wherever they like, a Hustler may be a
 * physical store, and the spot can be MOVED mid-session — so all three
 * are tracked separately and none is inferred from another.
 *
 * Both apps broadcast on `hustle-live:<conversationId>` (the same channel
 * their live activity cards ride on). Each message carries that device's
 * own position plus the venue as it currently knows it — no device knows
 * where the other person is, so the picture is assembled from both sides,
 * and a venue move arrives on the next fix from either party.
 *
 * A marker that stops moving means the app behind it went quiet; the
 * "seen" stamps say exactly when. Finished sessions plot the recorded
 * final positions instead.
 */

declare global {
  interface Window {
    /** Present once the loader below has injected the Maps script. */
    google?: typeof google;
  }
}

type LiveBroadcast = {
  party: "worker" | "payer";
  profileId: string;
  lat: number;
  lng: number;
  venueLat: number;
  venueLng: number;
  venueLabel: string;
  remainingMeters: number;
  etaSeconds: number | null;
  progress: number;
  arrived: boolean;
  /** True when this side is the one making the journey — lets a real ETA
   * be told from a straight-line estimate. */
  travelling: boolean;
};

export type Point = { lat: number; lng: number; label?: string | null };

export type FinalPin = {
  label: string;
  role: string;
  lat: number;
  lng: number;
};

const COLORS = {
  worker: "#14B8A6",
  payer: "#6366F1",
  venue: "#F59E0B",
  final: "#EF4444",
} as const;

type Slot = keyof typeof COLORS;

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
    // `loading=async` is Google's documented pairing for a script injected
    // this way; without it the API logs a performance warning that reads
    // like a failure while you're debugging a real one.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
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

function icon(slot: Slot): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 13,
    fillColor: COLORS[slot],
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2.5,
  };
}

type PartyState = {
  lat: number;
  lng: number;
  at: number;
  remainingMeters: number;
  etaSeconds: number | null;
  arrived: boolean;
  travelling: boolean;
};

export function LiveLocationMap({
  conversationId,
  live,
  venue: initialVenue,
  finals,
  workerName,
  payerName,
}: {
  conversationId: string;
  /** False for a finished session: plot the finals statically, no channel. */
  live: boolean;
  /** The venue as the server last saw it. Superseded by whatever the apps
   * broadcast, which is how a mid-session move shows up here. */
  venue: Point | null;
  finals: FinalPin[];
  workerName: string;
  payerName: string;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const fittedRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [venue, setVenue] = useState<Point | null>(initialVenue);
  const [worker, setWorker] = useState<PartyState | null>(null);
  const [payer, setPayer] = useState<PartyState | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // ── The map itself ────────────────────────────────────────────────
  useEffect(() => {
    // Missing key renders its own placeholder below — no map to build.
    if (!apiKey) return;

    const markers = markersRef.current;
    let cancelled = false;

    void loadGoogleMaps(apiKey)
      .then((g) => {
        if (cancelled || !mapNodeRef.current) return;
        const centre = initialVenue ?? { lat: 7.3775, lng: 3.947 }; // Ibadan
        mapRef.current = new g.maps.Map(mapNodeRef.current, {
          center: { lat: centre.lat, lng: centre.lng },
          zoom: 15,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        setMapReady(true);
      })
      .catch(() => setMapError("Google Maps failed to load."));

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      mapRef.current = null;
    };
    // The initial venue is a server-rendered prop, fixed for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ── The live channel ──────────────────────────────────────────────
  useEffect(() => {
    if (!live) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`hustle-live:${conversationId}`)
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        const update = payload as Partial<LiveBroadcast>;
        if (
          (update.party !== "worker" && update.party !== "payer") ||
          typeof update.lat !== "number" ||
          typeof update.lng !== "number"
        ) {
          return;
        }

        const next: PartyState = {
          lat: update.lat,
          lng: update.lng,
          at: Date.now(),
          remainingMeters:
            typeof update.remainingMeters === "number"
              ? update.remainingMeters
              : Number.NaN,
          etaSeconds:
            typeof update.etaSeconds === "number" ? update.etaSeconds : null,
          arrived: Boolean(update.arrived),
          travelling: Boolean(update.travelling),
        };
        if (update.party === "worker") setWorker(next);
        else setPayer(next);

        // Every message carries the venue, so a move lands here whichever
        // party's app is awake to report it.
        if (
          typeof update.venueLat === "number" &&
          typeof update.venueLng === "number"
        ) {
          setVenue((prev) =>
            prev &&
            prev.lat === update.venueLat &&
            prev.lng === update.venueLng
              ? prev
              : {
                  lat: update.venueLat!,
                  lng: update.venueLng!,
                  label: update.venueLabel ?? prev?.label ?? null,
                },
          );
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [live, conversationId]);

  // ── Markers, synced from state ────────────────────────────────────
  useEffect(() => {
    const g = window.google;
    const map = mapRef.current;
    if (!mapReady || !g?.maps || !map) return;

    const markers = markersRef.current;
    const place = (key: string, slot: Slot, point: Point, title: string) => {
      const position = { lat: point.lat, lng: point.lng };
      const existing = markers.get(key);
      if (existing) {
        existing.setPosition(position);
        existing.setTitle(title);
        return;
      }
      markers.set(
        key,
        new g.maps.Marker({
          map,
          position,
          title,
          icon: icon(slot),
          label: {
            text: slot === "venue" ? "H" : slot === "worker" ? "W" : "P",
            color: "#FFFFFF",
            fontSize: "11px",
            fontWeight: "700",
          },
          zIndex: slot === "venue" ? 1 : 3,
        }),
      );
    };

    if (venue) {
      place("venue", "venue", venue, venue.label ?? "Hustle location");
    }
    if (worker) place("worker", "worker", worker, workerName);
    if (payer) place("payer", "payer", payer, payerName);
    finals.forEach((pin, index) => {
      place(`final:${index}`, "final", pin, `${pin.label} (${pin.role})`);
    });

    // One automatic framing, once there is more than a lone venue pin —
    // after that the camera belongs to the operator.
    if (!fittedRef.current && markers.size > 1) {
      const bounds = new g.maps.LatLngBounds();
      markers.forEach((marker) => {
        const at = marker.getPosition();
        if (at) bounds.extend(at);
      });
      map.fitBounds(bounds, 90);
      fittedRef.current = true;
    }
  }, [mapReady, venue, worker, payer, finals, workerName, payerName]);

  const seen = (state: PartyState | null) =>
    state ? `seen ${new Date(state.at).toLocaleTimeString()}` : null;

  const journey = (state: PartyState | null) => {
    if (!state || Number.isNaN(state.remainingMeters)) return null;
    if (state.arrived) return "at the venue";
    const distance = formatDistance(state.remainingMeters);
    if (state.travelling && state.etaSeconds && state.etaSeconds > 0) {
      return `${distance} out · ETA ${Math.max(1, Math.round(state.etaSeconds / 60))} min`;
    }
    return `${distance} from venue`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Legend
          color={COLORS.worker}
          detail={[journey(worker), seen(worker)].filter(Boolean).join(" · ")}
          fallback={live ? "waiting for signal" : "no live signal"}
          letter="W"
          name={`${workerName} (Hustler)`}
        />
        <Legend
          color={COLORS.payer}
          detail={[journey(payer), seen(payer)].filter(Boolean).join(" · ")}
          fallback={live ? "waiting for signal" : "no live signal"}
          letter="P"
          name={`${payerName} (Provider)`}
        />
        <Legend
          color={COLORS.venue}
          detail={venue?.label ?? ""}
          fallback="no location set"
          letter="H"
          name="Hustle location"
        />
      </div>

      {mapError || !apiKey ? (
        <div className="flex h-[480px] items-center justify-center rounded-xl border border-white/10 px-6 text-center text-sm text-muted-foreground">
          {mapError ?? "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set."}
        </div>
      ) : (
        <div
          className="h-[480px] w-full overflow-hidden rounded-xl border border-white/10"
          ref={mapNodeRef}
        />
      )}

      {live ? (
        <p className="text-xs text-muted-foreground">
          All three points are tracked separately — the Hustle&apos;s location
          is wherever it was set or last moved to, not either
          participant&apos;s position. Markers move only while that
          participant&apos;s app is broadcasting; a still marker means their
          app went quiet, and the &quot;seen&quot; stamp is its last word.
        </p>
      ) : null}
    </div>
  );
}

function Legend({
  color,
  letter,
  name,
  detail,
  fallback,
}: {
  color: string;
  letter: string;
  name: string;
  detail: string;
  fallback: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {letter}
      </span>
      <span>
        {name}{" "}
        <span className="text-muted-foreground">· {detail || fallback}</span>
      </span>
    </span>
  );
}
