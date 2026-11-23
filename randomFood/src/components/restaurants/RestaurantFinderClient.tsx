"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Database,
  FlaskConical,
  List,
  Map as MapIcon,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { DISTANCE_OPTIONS_KM, type DistanceKm } from "@/lib/constants";
import type { ExternalApiMode } from "@/lib/env";
import type { SelectedLocation } from "@/lib/locations";
import { cn } from "@/lib/cn";
import { LocationPicker } from "@/components/location/LocationPicker";
import { useUserLocation } from "@/components/location/UserLocationProvider";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { RestaurantMapView } from "@/components/restaurants/RestaurantMapView";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import type {
  ResolvedMenuContext,
  RestaurantDataOrigin,
  RestaurantDTO,
} from "@/server/types/restaurant";

interface NearbyApiResponse {
  success: boolean;
  data?: {
    restaurants: RestaurantDTO[];
    total: number;
    resolvedMenu: ResolvedMenuContext | null;
    center: {
      latitude: number;
      longitude: number;
      radiusKm: number;
    };
  };
  meta?: {
    mode?: ExternalApiMode;
    dataOrigin?: RestaurantDataOrigin;
    cacheHit?: boolean;
    postgisUsed?: boolean;
  };
  error?: {
    message?: string;
  };
}

interface RestaurantFinderClientProps {
  initialLocation: SelectedLocation;
  hasExplicitLocationParams?: boolean;
  initialRadiusKm: DistanceKm;
  initialMenuId?: string;
  initialMenuSlug?: string;
  initialMenuName?: string;
  externalApiMode: ExternalApiMode;
  hasGoogleMapsKey: boolean;
}

const RATING_FILTERS = [
  { label: "ทุกคะแนน", value: "" },
  { label: "3.5+ ★", value: "3.5" },
  { label: "4.0+ ★", value: "4.0" },
  { label: "4.5+ ★", value: "4.5" },
];

const PRICE_TIER_FILTERS = [
  { label: "ทุกราคา", value: "ANY" },
  { label: "ประหยัด (≤฿100)", value: "BUDGET" },
  { label: "ปานกลาง (฿101–300)", value: "MODERATE" },
  { label: "จัดเต็ม (>฿300)", value: "PREMIUM" },
];

const SORT_OPTIONS = [
  { label: "แนะนำ (คะแนน + ระยะทาง)", value: "recommended" },
  { label: "ใกล้ที่สุดก่อน", value: "distance" },
  { label: "คะแนนรีวิวสูงสุด", value: "rating" },
  { label: "ราคาต่ำไปสูง", value: "price_asc" },
  { label: "ราคาสูงไปต่ำ", value: "price_desc" },
];

const VERIFICATION_FILTERS = [
  { label: "ทุกร้านในพื้นที่", value: "ALL" },
  { label: "เฉพาะร้านที่ตรงเมนู", value: "MATCHED_ONLY" },
  { label: "เฉพาะยืนยันเมนู (VERIFIED)", value: "VERIFIED_ONLY" },
];

function originLabel(origin: RestaurantDataOrigin | null): string {
  switch (origin) {
    case "postgis+google-places":
      return "PostGIS + Google Places (Live)";
    case "google-places-live":
      return "Google Places API (Live)";
    case "postgis":
      return "PostgreSQL + PostGIS";
    case "mock-dataset":
      return "Mock Dataset (ข้อมูลทดสอบ)";
    default:
      return "กำลังตรวจสอบแหล่งข้อมูล";
  }
}

export function RestaurantFinderClient({
  initialLocation,
  hasExplicitLocationParams = false,
  initialRadiusKm,
  initialMenuId,
  initialMenuSlug,
  initialMenuName,
  externalApiMode,
  hasGoogleMapsKey,
}: RestaurantFinderClientProps) {
  const {
    location: liveUserLocation,
    radiusKm: savedRadiusKm,
    setLocation: setGlobalLocation,
    setRadiusKm: setGlobalRadiusKm,
  } = useUserLocation();

  const [useContextLocation, setUseContextLocation] = useState<boolean>(
    !hasExplicitLocationParams
  );
  const [localLocation, setLocalLocation] =
    useState<SelectedLocation>(initialLocation);
  const [localRadiusKm, setLocalRadiusKm] =
    useState<DistanceKm>(initialRadiusKm);

  const location = useContextLocation ? liveUserLocation : localLocation;
  const radiusKm = useContextLocation ? savedRadiusKm : localRadiusKm;

  const setLocation = useCallback(
    (next: SelectedLocation) => {
      setUseContextLocation(true);
      setLocalLocation(next);
      setGlobalLocation(next);
    },
    [setGlobalLocation]
  );

  const setRadiusKm = useCallback(
    (km: DistanceKm) => {
      setUseContextLocation(true);
      setLocalRadiusKm(km);
      setGlobalRadiusKm(km);
    },
    [setGlobalRadiusKm]
  );
  const [menuId, setMenuId] = useState<string | undefined>(initialMenuId);
  const [menuSlug, setMenuSlug] = useState<string | undefined>(initialMenuSlug);
  const [menuName, setMenuName] = useState<string | undefined>(initialMenuName);

  const [minRating, setMinRating] = useState<string>("");
  const [priceTier, setPriceTier] = useState<string>("ANY");
  const [openNow, setOpenNow] = useState<boolean>(false);
  const [verificationFilter, setVerificationFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("recommended");

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showLocationEditor, setShowLocationEditor] = useState<boolean>(false);
  const [selectedMapRestaurantId, setSelectedMapRestaurantId] = useState<
    string | null
  >(null);

  const [restaurants, setRestaurants] = useState<RestaurantDTO[]>([]);
  const [resolvedMenu, setResolvedMenu] = useState<ResolvedMenuContext | null>(
    null
  );
  const [apiMode, setApiMode] = useState<ExternalApiMode>(externalApiMode);
  const [dataOrigin, setDataOrigin] = useState<RestaurantDataOrigin | null>(
    null
  );
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("lat", String(location.latitude));
      params.set("lng", String(location.longitude));
      params.set("radiusKm", String(radiusKm));
      params.set("sortBy", sortBy);
      if (menuId) params.set("menuId", menuId);
      if (menuSlug) params.set("menuSlug", menuSlug);
      if (minRating) params.set("minRating", minRating);
      if (priceTier !== "ANY") params.set("priceTier", priceTier);
      if (openNow) params.set("openNow", "true");
      if (verificationFilter !== "ALL") {
        params.set("verificationFilter", verificationFilter);
      }

      const res = await fetch(`/api/v1/restaurants/nearby?${params.toString()}`, {
        cache: "no-store",
      });
      const json: NearbyApiResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(
          json.error?.message || "ไม่สามารถค้นหาร้านอาหารใกล้คุณได้"
        );
      }

      setRestaurants(json.data.restaurants);
      setResolvedMenu(json.data.resolvedMenu);
      setApiMode(json.meta?.mode ?? externalApiMode);
      setDataOrigin(json.meta?.dataOrigin ?? null);
      setCacheHit(Boolean(json.meta?.cacheHit));
      setSelectedMapRestaurantId((prev) =>
        json.data!.restaurants.some((r) => r.id === prev)
          ? prev
          : (json.data!.restaurants[0]?.id ?? null)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบค้นหาร้านอาหาร"
      );
    } finally {
      setLoading(false);
    }
  }, [
    externalApiMode,
    location.latitude,
    location.longitude,
    menuId,
    menuSlug,
    minRating,
    openNow,
    priceTier,
    radiusKm,
    sortBy,
    verificationFilter,
  ]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  function handleClearMenuFilter() {
    setMenuId(undefined);
    setMenuSlug(undefined);
    setMenuName(undefined);
    setResolvedMenu(null);
  }

  function handleResetFilters() {
    setMinRating("");
    setPriceTier("ANY");
    setOpenNow(false);
    setVerificationFilter("ALL");
    setSortBy("recommended");
    setRadiusKm(10);
  }

  function buildDetailHref(restaurantId: string): string {
    const params = new URLSearchParams();
    params.set("lat", String(location.latitude));
    params.set("lng", String(location.longitude));
    if (menuSlug) params.set("menuSlug", menuSlug);
    return `/restaurants/${encodeURIComponent(restaurantId)}?${params.toString()}`;
  }

  const switchViewMode = useCallback(
    (nextMode: "list" | "map") => {
      setViewMode(nextMode);
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (nextMode === "map") {
        if (url.searchParams.get("view") !== "map") {
          url.searchParams.set("view", "map");
          window.history.pushState({ frView: "map" }, "", url.toString());
        }
      } else if (url.searchParams.get("view") === "map") {
        url.searchParams.delete("view");
        window.history.replaceState({ frView: "list" }, "", url.toString());
      }
    },
    []
  );

  // Sync browser Back/Forward buttons between Map View and List View
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setViewMode(params.get("view") === "map" ? "map" : "list");
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function handleSelectOnMap(restaurant: RestaurantDTO) {
    setSelectedMapRestaurantId(restaurant.id);
    switchViewMode("map");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const displayMenuName = resolvedMenu?.nameTh ?? menuName;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {viewMode === "map" ? (
          <button
            type="button"
            onClick={() => switchViewMode("list")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้ารายการร้านอาหาร
          </button>
        ) : (
          <Link
            href={displayMenuName ? "/random" : "/"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {displayMenuName ? "กลับไปหน้าสุ่มอาหาร" : "กลับหน้าแรก"}
          </Link>
        )}

        <button
          type="button"
          onClick={() => setShowLocationEditor((prev) => !prev)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            showLocationEditor
              ? "border-orange-500 bg-orange-50 text-orange-800"
              : "border-border-subtle bg-surface text-stone-700 hover:border-orange-300"
          )}
        >
          <MapPin className="h-3.5 w-3.5 text-orange-600" />
          {location.label} • {radiusKm} กม. (เปลี่ยนตำแหน่ง)
        </button>
      </div>

      {/* Header */}
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
              {displayMenuName
                ? `ร้านใกล้คุณสำหรับ "${displayMenuName}"`
                : "ค้นหาร้านอาหารใกล้คุณ"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              พื้นที่: <strong className="text-stone-700">{location.label}</strong> •
              รัศมี <strong className="text-stone-700">{radiusKm} กม.</strong>
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex self-start rounded-xl border border-border-subtle bg-surface p-1 shadow-sm sm:self-auto">
          <button
            type="button"
            onClick={() => switchViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
              viewMode === "list"
                ? "bg-orange-600 text-white"
                : "text-stone-600 hover:text-stone-900"
            )}
          >
            <List className="h-3.5 w-3.5" />
            List View
          </button>
          <button
            type="button"
            onClick={() => switchViewMode("map")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
              viewMode === "map"
                ? "bg-orange-600 text-white"
                : "text-stone-600 hover:text-stone-900"
            )}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map View
          </button>
        </div>
      </div>

      {/* Selected Menu Context Chip */}
      {displayMenuName && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-orange-50/70 px-4 py-2.5 text-xs text-orange-950">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <span>
              กำลังค้นหาและจัดอันดับร้านที่เกี่ยวข้องกับเมนู{" "}
              <strong>{displayMenuName}</strong> — ระบบจะแสดงป้าย{" "}
              <strong>VERIFIED</strong> / <strong>INFERRED</strong>{" "}
              เฉพาะร้านที่มีหลักฐานรองรับเท่านั้น
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearMenuFilter}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100"
          >
            <X className="h-3 w-3" />
            ดูร้านทั้งหมดในพื้นที่
          </button>
        </div>
      )}

      {/* Collapsible Location Picker Drawer */}
      {showLocationEditor && (
        <div className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">
              ปรับตำแหน่งและรัศมีการค้นหา
            </h2>
            <button
              type="button"
              onClick={() => setShowLocationEditor(false)}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="ปิดหน้าต่างเลือกตำแหน่ง"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <LocationPicker
            value={location}
            onChange={setLocation}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            showRadiusSelector
            compact
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="mt-5 rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <SlidersHorizontal className="h-3.5 w-3.5 text-orange-600" />
            ตัวกรอง:
          </span>

          {/* Distance quick selector */}
          <div className="flex flex-wrap items-center gap-1">
            {DISTANCE_OPTIONS_KM.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  radiusKm === km
                    ? "border-orange-500 bg-orange-600 text-white"
                    : "border-border-subtle bg-surface text-stone-600 hover:border-orange-300"
                )}
              >
                {km} กม.
              </button>
            ))}
          </div>

          <span className="hidden h-4 w-px bg-border-subtle sm:inline-block" />

          {/* Rating */}
          <select
            aria-label="กรองตามคะแนนรีวิว"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:border-orange-500 focus:outline-none"
          >
            {RATING_FILTERS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Price Tier */}
          <select
            aria-label="กรองตามระดับราคา"
            value={priceTier}
            onChange={(e) => setPriceTier(e.target.value)}
            className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:border-orange-500 focus:outline-none"
          >
            {PRICE_TIER_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Open Now */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-stone-700">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-orange-600"
            />
            เปิดอยู่ตอนนี้
          </label>

          {/* Menu Verification Filter (shown when searching for a specific menu) */}
          {displayMenuName && (
            <select
              aria-label="กรองตามสถานะยืนยันเมนู"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:border-orange-500 focus:outline-none"
            >
              {VERIFICATION_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-stone-500">เรียงตาม:</span>
            <select
              aria-label="เรียงลำดับร้านอาหาร"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:border-orange-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transparency & Status Strip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <div>
          {loading
            ? "กำลังค้นหาร้านอาหารใกล้ตำแหน่งของคุณ..."
            : `พบทั้งหมด ${restaurants.length} ร้านในรัศมี ${radiusKm} กม.`}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              apiMode === "live"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
            )}
          >
            {apiMode === "live" ? (
              <Database className="h-3 w-3" />
            ) : (
              <FlaskConical className="h-3 w-3" />
            )}
            {originLabel(dataOrigin)}
          </span>
          {cacheHit && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
              Cache Hit
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface sm:flex-row"
              >
                <div className="h-44 w-full animate-pulse bg-stone-200 sm:h-48 sm:w-52" />
                <div className="flex-1 space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
                  <div className="h-3.5 w-full animate-pulse rounded bg-stone-100" />
                  <div className="flex gap-2">
                    <div className="h-6 w-28 animate-pulse rounded-lg bg-stone-100" />
                    <div className="h-6 w-24 animate-pulse rounded-lg bg-stone-100" />
                  </div>
                  <div className="h-8 w-40 animate-pulse rounded-xl bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="ไม่สามารถค้นหาร้านอาหารได้"
            message={error}
            onRetry={fetchNearby}
          />
        ) : restaurants.length === 0 ? (
          <EmptyState
            title={`ไม่พบร้านอาหารในรัศมี ${radiusKm} กม. ที่ตรงกับตัวกรอง`}
            description={
              apiMode === "mock"
                ? "คุณกำลังอยู่ใน Mock Mode ซึ่งมีข้อมูลร้านตัวอย่างในพื้นที่หลัก (เช่น กทม., เชียงใหม่, ภูเก็ต, ชลบุรี, ขอนแก่น) ลองขยายระยะทางเป็น 20 กม. หรือเลือกพื้นที่อื่น"
                : "ลองขยายรัศมีการค้นหา ลดเกณฑ์คะแนนขั้นต่ำ หรือล้างตัวกรองราคาเพื่อดูร้านเพิ่มเติม"
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {radiusKm < 20 && (
                  <button
                    type="button"
                    onClick={() => setRadiusKm(20)}
                    className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                  >
                    ขยายระยะทางเป็น 20 กม.
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-full border border-stone-300 bg-surface px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            }
          />
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                detailHref={buildDetailHref(restaurant.id)}
                isSelected={selectedMapRestaurantId === restaurant.id}
                onSelectOnMap={handleSelectOnMap}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RestaurantMapView
                center={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  radiusKm,
                }}
                restaurants={restaurants}
                selectedId={selectedMapRestaurantId}
                onSelect={(r) => setSelectedMapRestaurantId(r.id)}
                useLiveGoogleMaps={apiMode === "live" && hasGoogleMapsKey}
              />
            </div>

            <div className="space-y-3 lg:col-span-5 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
              {restaurants.map((restaurant, idx) => {
                const active = selectedMapRestaurantId === restaurant.id;
                return (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => setSelectedMapRestaurantId(restaurant.id)}
                    className={cn(
                      "w-full rounded-2xl border p-3.5 text-left transition-all",
                      active
                        ? "border-orange-500 bg-orange-50/70 shadow-sm"
                        : "border-border-subtle bg-surface hover:border-orange-300"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          active
                            ? "bg-orange-600 text-white"
                            : "bg-stone-800 text-white"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-stone-900">
                          {restaurant.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-stone-500">
                          {restaurant.address}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                          <span className="font-semibold text-orange-700">
                            {restaurant.distanceKm < 1
                              ? `${Math.round(restaurant.distanceKm * 1000)} ม.`
                              : `${restaurant.distanceKm.toFixed(1)} กม.`}
                          </span>
                          <span>•</span>
                          <span>
                            ★ {restaurant.googleRating?.toFixed(1) ?? "–"} (Google)
                          </span>
                          {restaurant.menuMatch && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                restaurant.menuMatch.verificationStatus === "VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              )}
                            >
                              {restaurant.menuMatch.verificationStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
