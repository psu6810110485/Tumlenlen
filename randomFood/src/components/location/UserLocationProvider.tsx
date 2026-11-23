"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DISTANCE_OPTIONS_KM, type DistanceKm } from "@/lib/constants";
import {
  DEFAULT_SELECTED_LOCATION,
  findNearestDistrict,
  type SelectedLocation,
} from "@/lib/locations";

const LOCATION_STORAGE_KEY = "fr_user_location_v1";
const RADIUS_STORAGE_KEY = "fr_user_radius_km_v1";

interface UserLocationContextValue {
  location: SelectedLocation;
  radiusKm: DistanceKm;
  gpsLoading: boolean;
  gpsWatching: boolean;
  gpsAccuracyMeters: number | null;
  gpsError: string | null;
  lastUpdatedAt: number | null;
  setLocation: (next: SelectedLocation) => void;
  setRadiusKm: (km: DistanceKm) => void;
  requestLiveGps: () => void;
  stopLiveGps: () => void;
}

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

function isValidDistanceKm(value: unknown): value is DistanceKm {
  return (
    typeof value === "number" &&
    (DISTANCE_OPTIONS_KM as readonly number[]).includes(value)
  );
}

function formatGpsLocation(lat: number, lng: number): SelectedLocation {
  const nearest = findNearestDistrict(lat, lng);
  return {
    mode: "gps",
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    province: nearest.province,
    district: nearest.district,
    label: `GPS สด (ใกล้ ${nearest.district}, ${nearest.province})`,
  };
}

export function UserLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, setLocationState] = useState<SelectedLocation>(
    DEFAULT_SELECTED_LOCATION
  );
  const [radiusKm, setRadiusKmState] = useState<DistanceKm>(5);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsWatching, setGpsWatching] = useState(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(
    null
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);

  const stopLiveGps = useCallback(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.geolocation &&
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsWatching(false);
    setGpsLoading(false);
  }, []);

  const persistLocation = useCallback((next: SelectedLocation) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const setLocation = useCallback(
    (next: SelectedLocation) => {
      if (next.mode === "area") {
        stopLiveGps();
        setGpsError(null);
        setGpsAccuracyMeters(null);
      }
      setLocationState(next);
      setLastUpdatedAt(Date.now());
      persistLocation(next);
    },
    [persistLocation, stopLiveGps]
  );

  const setRadiusKm = useCallback((km: DistanceKm) => {
    setRadiusKmState(km);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(RADIUS_STORAGE_KEY, String(km));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const startWatchingPosition = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("เบราว์เซอร์ไม่รองรับการอ่านพิกัด GPS");
      return;
    }

    stopLiveGps();
    setGpsLoading(true);
    setGpsError(null);

    const handlePosition = (pos: GeolocationPosition) => {
      const now = Date.now();
      // Throttle watch updates to every 5 seconds after initial fix to avoid unnecessary API refetches
      if (lastEmitRef.current !== 0 && now - lastEmitRef.current < 5000) {
        return;
      }
      lastEmitRef.current = now;

      const nextLoc = formatGpsLocation(
        pos.coords.latitude,
        pos.coords.longitude
      );
      setLocationState(nextLoc);
      setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
      setLastUpdatedAt(now);
      setGpsLoading(false);
      setGpsWatching(true);
      setGpsError(null);
      persistLocation(nextLoc);
    };

    const handleError = (err: GeolocationPositionError) => {
      setGpsLoading(false);
      setGpsWatching(false);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsError("ไม่ได้รับสิทธิ์เข้าถึง GPS — ใช้การเลือกจังหวัด/อำเภอแทน");
      } else {
        setGpsError("ไม่สามารถอ่านพิกัด GPS ได้ในขณะนี้");
      }
    };

    lastEmitRef.current = 0;
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, [persistLocation, stopLiveGps]);

  // Hydrate saved location & auto-resume live GPS if permission was already granted
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedRadius = Number(window.localStorage.getItem(RADIUS_STORAGE_KEY));
      if (isValidDistanceKm(savedRadius)) {
        setRadiusKmState(savedRadius);
      }

      const rawLoc = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (rawLoc) {
        const parsed = JSON.parse(rawLoc) as SelectedLocation;
        if (
          parsed &&
          typeof parsed.latitude === "number" &&
          typeof parsed.longitude === "number" &&
          (parsed.mode === "gps" || parsed.mode === "area")
        ) {
          setLocationState(parsed);
        }
      }
    } catch {
      // Ignore malformed localStorage
    }

    // Automatically track live GPS if browser permission is already "granted"
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (status.state === "granted") {
            startWatchingPosition();
          }
        })
        .catch(() => {
          // Permissions API unsupported in some browsers
        });
    }

    return () => {
      stopLiveGps();
    };
  }, [startWatchingPosition, stopLiveGps]);

  return (
    <UserLocationContext.Provider
      value={{
        location,
        radiusKm,
        gpsLoading,
        gpsWatching,
        gpsAccuracyMeters,
        gpsError,
        lastUpdatedAt,
        setLocation,
        setRadiusKm,
        requestLiveGps: startWatchingPosition,
        stopLiveGps,
      }}
    >
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation(): UserLocationContextValue {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    throw new Error("useUserLocation must be used within UserLocationProvider");
  }
  return ctx;
}
