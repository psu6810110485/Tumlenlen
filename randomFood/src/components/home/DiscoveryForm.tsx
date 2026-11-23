"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, LocateFixed, MapPin, Sparkles, Wallet } from "lucide-react";
import {
  BUDGET_OPTIONS,
  DEFAULT_LOCATION_AREAS,
  DISTANCE_OPTIONS_KM,
  FOOD_CATEGORIES,
  MEAL_TYPE_OPTIONS,
  type DistanceKm,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

export function DiscoveryForm() {
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("ANY");
  const [mealType, setMealType] = useState<string>("ANY");
  const [distanceKm, setDistanceKm] = useState<DistanceKm>(5);
  const [locationMode, setLocationMode] = useState<"area" | "gps">("area");
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number>(0);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  }

  function handleRequestGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("เบราว์เซอร์ไม่รองรับ GPS กรุณาเลือกจังหวัด/อำเภอแทน");
      setLocationMode("area");
      return;
    }

    setLocationMode("gps");
    setGpsStatus("กำลังขอตำแหน่ง GPS จากอุปกรณ์ของคุณ...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setGpsStatus("รับตำแหน่ง GPS เรียบร้อยแล้ว");
      },
      () => {
        setGpsCoords(null);
        setGpsStatus("ไม่ได้รับสิทธิ์เข้าถึง GPS — สลับไปใช้การเลือกจังหวัด/อำเภอให้อัตโนมัติ");
        setLocationMode("area");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    params.set("budget", budget);
    params.set("mealType", mealType);
    params.set("radiusKm", String(distanceKm));

    if (locationMode === "gps" && gpsCoords) {
      params.set("lat", String(gpsCoords.lat));
      params.set("lng", String(gpsCoords.lng));
      params.set("locMode", "gps");
    } else {
      const area = DEFAULT_LOCATION_AREAS[selectedAreaIndex] ?? DEFAULT_LOCATION_AREAS[0];
      params.set("lat", String(area.latitude));
      params.set("lng", String(area.longitude));
      params.set("area", `${area.district}, ${area.province}`);
      params.set("locMode", "area");
    }

    router.push(`/random?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-lg shadow-orange-950/5 sm:p-8"
    >
      {/* 1. Categories */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-stone-900">
            1. หมวดหมู่อาหาร
          </label>
          <span className="text-xs text-stone-500">
            {selectedCategories.length === 0
              ? "ทุกหมวดหมู่"
              : `เลือกแล้ว ${selectedCategories.length} หมวด`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {FOOD_CATEGORIES.map((category) => {
            const active = selectedCategories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-all",
                  active
                    ? "border-orange-500 bg-orange-50 text-orange-900 shadow-sm"
                    : "border-border-subtle bg-surface text-stone-700 hover:border-orange-300 hover:bg-orange-50/40"
                )}
              >
                <span className="text-lg" aria-hidden="true">
                  {category.icon}
                </span>
                <span className="truncate">{category.nameTh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Budget & Meal Type */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Wallet className="h-4 w-4 text-orange-500" />
            2. งบประมาณต่อมื้อ
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((option) => {
              const active = budget === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBudget(option.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-all",
                    active
                      ? "border-orange-500 bg-orange-50 text-orange-900"
                      : "border-border-subtle bg-surface text-stone-700 hover:border-orange-300"
                  )}
                >
                  <div className="text-xs font-semibold">{option.labelTh}</div>
                  <div className="text-[11px] text-stone-500">{option.rangeTh}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            3. มื้ออาหาร
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {MEAL_TYPE_OPTIONS.map((option) => {
              const active = mealType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMealType(option.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                    active
                      ? "border-orange-500 bg-orange-600 text-white"
                      : "border-border-subtle bg-surface text-stone-700 hover:border-orange-300"
                  )}
                >
                  {option.labelTh}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Location & Distance */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <MapPin className="h-4 w-4 text-orange-500" />
            4. ตำแหน่งของคุณ
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleRequestGps}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                locationMode === "gps"
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-border-subtle text-stone-700 hover:bg-stone-50"
              )}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              ใช้ GPS ปัจจุบัน
            </button>
            <button
              type="button"
              onClick={() => setLocationMode("area")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                locationMode === "area"
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-border-subtle text-stone-700 hover:bg-stone-50"
              )}
            >
              เลือกจังหวัด / อำเภอ
            </button>
          </div>

          {locationMode === "area" ? (
            <select
              aria-label="เลือกจังหวัดและอำเภอ"
              value={selectedAreaIndex}
              onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
              className="mt-2.5 w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
            >
              {DEFAULT_LOCATION_AREAS.map((area, idx) => (
                <option key={`${area.province}-${area.district}`} value={idx}>
                  {area.province} — {area.district}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2.5 rounded-xl border border-border-subtle bg-surface-muted/60 px-3 py-2.5 text-xs text-stone-700">
              {gpsCoords
                ? `พิกัด GPS: ${gpsCoords.lat}, ${gpsCoords.lng}`
                : gpsStatus || "กำลังรอพิกัด GPS..."}
            </div>
          )}

          {gpsStatus && locationMode === "area" && (
            <p className="mt-1.5 text-[11px] text-amber-700">{gpsStatus}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-900">
            5. ระยะทางค้นหาร้าน
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {DISTANCE_OPTIONS_KM.map((km) => {
              const active = distanceKm === km;
              return (
                <button
                  key={km}
                  type="button"
                  onClick={() => setDistanceKm(km)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all",
                    active
                      ? "border-orange-500 bg-orange-600 text-white shadow-sm"
                      : "border-border-subtle bg-surface text-stone-700 hover:border-orange-300"
                  )}
                >
                  {km} กม.
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            ระบบจะค้นหาร้านในรัศมี {distanceKm} กิโลเมตรด้วย PostGIS Spatial Query
          </p>
        </div>
      </div>

      {/* Submit CTA */}
      <div className="mt-8">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-base font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:from-orange-700 hover:to-amber-600 active:scale-[0.99]"
        >
          <Dices className="h-5 w-5" />
          สุ่มอาหารเลย!
        </button>
      </div>
    </form>
  );
}
