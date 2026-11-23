"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  FlaskConical,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import { buildGoogleMapsDirectionsUrl, formatDistanceTh } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { RestaurantDTO } from "@/server/types/restaurant";

interface RestaurantMapViewProps {
  center: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  restaurants: RestaurantDTO[];
  selectedId: string | null;
  onSelect: (restaurant: RestaurantDTO) => void;
  useLiveGoogleMaps: boolean;
}

interface GoogleMapInstance {
  panTo: (latLng: { lat: number; lng: number }) => void;
}

interface GoogleMarkerInstance {
  addListener: (event: string, cb: () => void) => void;
  setMap: (map: unknown | null) => void;
  setIcon: (icon: Record<string, unknown>) => void;
  setZIndex: (zIndex: number) => void;
}

const PIN_SVG_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

function buildMarkerIcon(
  gmaps: NonNullable<NonNullable<Window["google"]>["maps"]>,
  isSelected: boolean
): Record<string, unknown> {
  return {
    path: PIN_SVG_PATH,
    fillColor: isSelected ? "#ea580c" : "#292524",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: isSelected ? 2.5 : 1.5,
    scale: isSelected ? 1.95 : 1.45,
    anchor: new gmaps.Point(12, 22),
    labelOrigin: new gmaps.Point(12, 9.5),
  };
}

declare global {
  interface Window {
    google?: {
      maps?: {
        Map: new (
          el: HTMLElement,
          opts: Record<string, unknown>
        ) => GoogleMapInstance;
        Marker: new (opts: Record<string, unknown>) => GoogleMarkerInstance;
        Circle: new (opts: Record<string, unknown>) => {
          setMap: (map: unknown | null) => void;
        };
        Point: new (x: number, y: number) => unknown;
        SymbolPath: { CIRCLE: unknown };
      };
    };
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.google?.maps) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fr-google-maps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&language=th&region=TH`;
    script.async = true;
    script.defer = true;
    script.dataset.frGoogleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

export function RestaurantMapView({
  center,
  restaurants,
  selectedId,
  onSelect,
  useLiveGoogleMaps,
}: RestaurantMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
  const markersByIdRef = useRef<
    Map<string, { marker: GoogleMarkerInstance; lat: number; lng: number }>
  >(new Map());
  const activeIdRef = useRef<string | null>(null);
  const [mapsLoadFailed, setMapsLoadFailed] = useState(false);

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((r) => r.id === selectedId) ?? restaurants[0] ?? null,
    [restaurants, selectedId]
  );

  const activeRestaurantId = selectedRestaurant?.id ?? null;
  activeIdRef.current = activeRestaurantId;

  // Live Google Maps initialization (only when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured in live mode)
  useEffect(() => {
    if (!useLiveGoogleMaps) return;
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!mapsKey || !mapContainerRef.current) return;

    let cancelled = false;
    const overlays: Array<{ setMap: (m: unknown | null) => void }> = [];
    const markersMap = new Map<
      string,
      { marker: GoogleMarkerInstance; lat: number; lng: number }
    >();

    loadGoogleMapsScript(mapsKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || !window.google?.maps) return;

        const gmaps = window.google.maps;
        const zoom =
          center.radiusKm <= 1
            ? 15
            : center.radiusKm <= 3
              ? 14
              : center.radiusKm <= 5
                ? 13
                : center.radiusKm <= 10
                  ? 12
                  : 11;

        const map = new gmaps.Map(mapContainerRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapInstanceRef.current = map;

        const circle = new gmaps.Circle({
          map,
          center: { lat: center.latitude, lng: center.longitude },
          radius: center.radiusKm * 1000,
          fillColor: "#ea580c",
          fillOpacity: 0.08,
          strokeColor: "#ea580c",
          strokeOpacity: 0.45,
          strokeWeight: 1.5,
        });
        overlays.push(circle);

        const userMarker = new gmaps.Marker({
          map,
          position: { lat: center.latitude, lng: center.longitude },
          title: "ตำแหน่งของคุณ",
          zIndex: 500,
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        overlays.push(userMarker);

        restaurants.forEach((rest, index) => {
          const isSelected = rest.id === activeIdRef.current;
          const marker = new gmaps.Marker({
            map,
            position: { lat: rest.latitude, lng: rest.longitude },
            title: rest.name,
            zIndex: isSelected ? 999 : 10 + index,
            icon: buildMarkerIcon(gmaps, isSelected),
            label: {
              text: String(index + 1),
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "11px",
            },
          });
          marker.addListener("click", () => onSelect(rest));
          overlays.push(marker);
          markersMap.set(rest.id, {
            marker,
            lat: rest.latitude,
            lng: rest.longitude,
          });
        });

        markersByIdRef.current = markersMap;
      })
      .catch(() => {
        if (!cancelled) setMapsLoadFailed(true);
      });

    return () => {
      cancelled = true;
      overlays.forEach((o) => o.setMap(null));
      markersMap.clear();
      markersByIdRef.current = new Map();
      mapInstanceRef.current = null;
    };
  }, [center, onSelect, restaurants, useLiveGoogleMaps]);

  // Smoothly highlight the selected marker with a distinct color & size without reloading the map
  useEffect(() => {
    if (!useLiveGoogleMaps || !window.google?.maps) return;
    const gmaps = window.google.maps;

    let idx = 0;
    markersByIdRef.current.forEach((entry, id) => {
      const isSelected = id === activeRestaurantId;
      entry.marker.setIcon(buildMarkerIcon(gmaps, isSelected));
      entry.marker.setZIndex(isSelected ? 999 : 10 + idx);
      if (isSelected && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: entry.lat, lng: entry.lng });
      }
      idx += 1;
    });
  }, [activeRestaurantId, useLiveGoogleMaps]);

  // Project coordinates onto a 0..100% radar canvas for fallback/mock map
  const plottedPins = useMemo(() => {
    const kmPerDegLat = 111.32;
    const kmPerDegLng =
      111.32 * Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180));
    const maxRangeKm = Math.max(center.radiusKm, 1);

    return restaurants.map((rest, index) => {
      const dxKm = (rest.longitude - center.longitude) * kmPerDegLng;
      const dyKm = (rest.latitude - center.latitude) * kmPerDegLat;

      // Map [-maxRangeKm, +maxRangeKm] into [10%, 90%]
      const xPct = Math.min(92, Math.max(8, 50 + (dxKm / maxRangeKm) * 40));
      const yPct = Math.min(92, Math.max(8, 50 - (dyKm / maxRangeKm) * 40));

      return { rest, index, xPct, yPct };
    });
  }, [center, restaurants]);

  const showLiveCanvas = useLiveGoogleMaps && !mapsLoadFailed;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
        {/* Map Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface-muted/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-stone-700">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span>
              ศูนย์กลางพิกัด: {center.latitude.toFixed(4)},{" "}
              {center.longitude.toFixed(4)} (รัศมี {center.radiusKm} กม.)
            </span>
          </div>

          {!showLiveCanvas && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
              <FlaskConical className="h-3 w-3" />
              แผนที่พิกัดสำรอง (Mock / Fallback Map)
            </span>
          )}
        </div>

        {/* Map Canvas */}
        {showLiveCanvas ? (
          <div ref={mapContainerRef} className="h-[420px] w-full bg-stone-100" />
        ) : (
          <div className="relative h-[380px] w-full overflow-hidden bg-gradient-to-br from-stone-50 via-orange-50/30 to-amber-50/40 sm:h-[420px]">
            {/* Grid & Concentric Radius Rings */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line x1="50" y1="0" x2="50" y2="100" stroke="#e7e5e4" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#e7e5e4" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="#fdba74" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
              <circle cx="50" cy="50" r="40" fill="rgba(234, 88, 12, 0.04)" stroke="#fb923c" strokeWidth="0.45" />
            </svg>

            {/* Compass & Scale Legend */}
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/85 px-2.5 py-1 text-[10px] font-medium text-stone-600 shadow-sm backdrop-blur">
              วงนอก = {center.radiusKm} กม. • วงใน = {(center.radiusKm / 2).toFixed(1)} กม.
            </div>
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-stone-500 shadow-sm">
              N ↑
            </div>

            {/* User Center Pin */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: "50%", top: "50%" }}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md" />
              <span className="mt-1 block whitespace-nowrap rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                คุณอยู่ที่นี่
              </span>
            </div>

            {/* Restaurant Pins */}
            {plottedPins.map(({ rest, index, xPct, yPct }) => {
              const active = selectedRestaurant?.id === rest.id;
              return (
                <button
                  key={rest.id}
                  type="button"
                  onClick={() => onSelect(rest)}
                  title={`${rest.name} (${formatDistanceTh(rest.distanceKm)})`}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 transition-transform",
                    active ? "z-20 scale-110" : "z-10 hover:z-20 hover:scale-110"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md",
                      active
                        ? "bg-orange-600 text-white ring-4 ring-orange-500/30"
                        : "bg-stone-800 text-white hover:bg-orange-500"
                    )}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Restaurant Quick Card */}
      {selectedRestaurant && (
        <div className="rounded-2xl border border-orange-200 bg-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  {selectedRestaurant.name}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                  <Navigation className="h-3 w-3" />
                  {formatDistanceTh(selectedRestaurant.distanceKm)}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {selectedRestaurant.address}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {selectedRestaurant.googleRating?.toFixed(1) ?? "–"} (
                  {selectedRestaurant.googleReviewCount} Google)
                </span>
                {selectedRestaurant.estimatedMinPrice !== null &&
                  selectedRestaurant.estimatedMaxPrice !== null && (
                    <span>
                      ฿{selectedRestaurant.estimatedMinPrice}–฿
                      {selectedRestaurant.estimatedMaxPrice}
                    </span>
                  )}
                <span className="text-[11px] text-stone-400">
                  พิกัด: {selectedRestaurant.latitude.toFixed(4)},{" "}
                  {selectedRestaurant.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            <a
              href={buildGoogleMapsDirectionsUrl(
                selectedRestaurant.latitude,
                selectedRestaurant.longitude,
                selectedRestaurant.name
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              เปิดใน Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
