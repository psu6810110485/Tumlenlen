"use client";

import { useState } from "react";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { DISTANCE_OPTIONS_KM, type DistanceKm } from "@/lib/constants";
import {
  THAILAND_PROVINCES,
  type SelectedLocation,
} from "@/lib/locations";
import { cn } from "@/lib/cn";

interface LocationPickerProps {
  value: SelectedLocation;
  onChange: (location: SelectedLocation) => void;
  radiusKm?: DistanceKm;
  onRadiusChange?: (km: DistanceKm) => void;
  showRadiusSelector?: boolean;
  compact?: boolean;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  radiusKm = 5,
  onRadiusChange,
  showRadiusSelector = false,
  compact = false,
  className,
}: LocationPickerProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const selectedProvinceName =
    value.province &&
    THAILAND_PROVINCES.some((p) => p.province === value.province)
      ? value.province
      : THAILAND_PROVINCES[0].province;

  const provinceObj =
    THAILAND_PROVINCES.find((p) => p.province === selectedProvinceName) ??
    THAILAND_PROVINCES[0];

  const selectedDistrictName =
    value.district &&
    provinceObj.districts.some((d) => d.district === value.district)
      ? value.district
      : provinceObj.districts[0].district;

  function handleSelectProvince(provinceName: string) {
    const prov =
      THAILAND_PROVINCES.find((p) => p.province === provinceName) ??
      THAILAND_PROVINCES[0];
    const firstDist = prov.districts[0];
    setGpsError(null);
    setGpsMessage(null);
    onChange({
      mode: "area",
      latitude: firstDist.latitude,
      longitude: firstDist.longitude,
      province: prov.province,
      district: firstDist.district,
      label: `${firstDist.district}, ${prov.province}`,
    });
  }

  function handleSelectDistrict(districtName: string) {
    const dist =
      provinceObj.districts.find((d) => d.district === districtName) ??
      provinceObj.districts[0];
    setGpsError(null);
    setGpsMessage(null);
    onChange({
      mode: "area",
      latitude: dist.latitude,
      longitude: dist.longitude,
      province: provinceObj.province,
      district: dist.district,
      label: `${dist.district}, ${provinceObj.province}`,
    });
  }

  function handleRequestGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("เบราว์เซอร์ไม่รองรับ GPS กรุณาเลือกจังหวัดและอำเภอแทน");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsMessage("กำลังขอตำแหน่ง GPS จากอุปกรณ์ของคุณ...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setGpsLoading(false);
        setGpsMessage("รับตำแหน่ง GPS ปัจจุบันเรียบร้อยแล้ว");
        onChange({
          mode: "gps",
          latitude: lat,
          longitude: lng,
          label: `ตำแหน่ง GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage(null);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "ไม่ได้รับสิทธิ์เข้าถึง GPS — กรุณาเลือกจังหวัดและอำเภอแทน"
          );
        } else {
          setGpsError(
            "ไม่สามารถอ่านพิกัด GPS ได้ในขณะนี้ — กรุณาเลือกจังหวัดและอำเภอแทน"
          );
        }
        // Fallback to area mode preserving current province/district
        const dist =
          provinceObj.districts.find(
            (d) => d.district === selectedDistrictName
          ) ?? provinceObj.districts[0];
        onChange({
          mode: "area",
          latitude: dist.latitude,
          longitude: dist.longitude,
          province: provinceObj.province,
          district: dist.district,
          label: `${dist.district}, ${provinceObj.province}`,
        });
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function handleSwitchToArea() {
    setGpsError(null);
    setGpsMessage(null);
    const dist =
      provinceObj.districts.find((d) => d.district === selectedDistrictName) ??
      provinceObj.districts[0];
    onChange({
      mode: "area",
      latitude: dist.latitude,
      longitude: dist.longitude,
      province: provinceObj.province,
      district: dist.district,
      label: `${dist.district}, ${provinceObj.province}`,
    });
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRequestGps}
          disabled={gpsLoading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
            value.mode === "gps"
              ? "border-orange-500 bg-orange-50 text-orange-800"
              : "border-border-subtle bg-surface text-stone-700 hover:bg-stone-50"
          )}
        >
          {gpsLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          ใช้ GPS ปัจจุบัน
        </button>

        <button
          type="button"
          onClick={handleSwitchToArea}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
            value.mode === "area"
              ? "border-orange-500 bg-orange-50 text-orange-800"
              : "border-border-subtle bg-surface text-stone-700 hover:bg-stone-50"
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          เลือกจังหวัด / อำเภอ
        </button>
      </div>

      {/* Mode Content */}
      {value.mode === "area" ? (
        <div className={cn("grid gap-2", compact ? "sm:grid-cols-2" : "grid-cols-2")}>
          <div>
            <label className="sr-only" htmlFor="location-province-select">
              เลือกจังหวัด
            </label>
            <select
              id="location-province-select"
              aria-label="เลือกจังหวัด"
              value={selectedProvinceName}
              onChange={(e) => handleSelectProvince(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
            >
              {THAILAND_PROVINCES.map((prov) => (
                <option key={prov.province} value={prov.province}>
                  {prov.province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sr-only" htmlFor="location-district-select">
              เลือกอำเภอหรือเขต
            </label>
            <select
              id="location-district-select"
              aria-label="เลือกอำเภอหรือเขต"
              value={selectedDistrictName}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
            >
              {provinceObj.districts.map((dist) => (
                <option key={dist.district} value={dist.district}>
                  {dist.district}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-3 py-2.5 text-xs text-stone-700">
          <span className="font-semibold text-orange-800">พิกัด GPS ปัจจุบัน:</span>{" "}
          {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </div>
      )}

      {gpsMessage && value.mode === "gps" && (
        <p className="text-[11px] text-emerald-700">{gpsMessage}</p>
      )}
      {gpsError && <p className="text-[11px] text-amber-700">{gpsError}</p>}

      {/* Optional Distance Radius Selector */}
      {showRadiusSelector && onRadiusChange && (
        <div className="pt-1">
          <p className="mb-2 text-xs font-semibold text-stone-700">
            รัศมีการค้นหา
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DISTANCE_OPTIONS_KM.map((km) => {
              const active = radiusKm === km;
              return (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRadiusChange(km)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
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
        </div>
      )}
    </div>
  );
}
