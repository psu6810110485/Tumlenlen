"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Dices,
  History,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  BUDGET_OPTIONS,
  FOOD_CATEGORIES,
  MEAL_TYPE_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/cn";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";

interface MenuItem {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  priceTier: "BUDGET" | "MODERATE" | "PREMIUM";
  mealTypes: string[];
  searchKeywords: string[];
  category: {
    id: string;
    slug: string;
    nameTh: string;
    nameEn: string;
    icon: string;
  };
}

interface RandomApiResponse {
  success: boolean;
  data?: {
    menu: MenuItem | null;
    totalMatching: number;
    remainingCandidates: number;
    exhausted: boolean;
    candidatesPreview: Array<{ id: string; nameTh: string; icon: string }>;
  };
  meta?: {
    source?: "database" | "mock-catalog";
  };
  error?: {
    message?: string;
  };
}

interface RandomizerClientProps {
  initialCategories: string[];
  initialBudget: string;
  initialMealType: string;
  radiusKm: string;
  lat?: string;
  lng?: string;
  area?: string;
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "มื้อเช้า",
  LUNCH: "มื้อกลางวัน",
  DINNER: "มื้อเย็น",
  LATE_NIGHT: "มื้อดึก",
  SNACK: "ของว่าง",
};

const PRICE_TIER_LABELS: Record<string, string> = {
  BUDGET: "ประหยัด",
  MODERATE: "ปานกลาง",
  PREMIUM: "จัดเต็ม",
};

const FALLBACK_SPIN_ITEMS = [
  { id: "s1", nameTh: "ข้าวกะเพราหมูสับไข่ดาว", icon: "🌶️" },
  { id: "s2", nameTh: "ราเมงซุปกระดูกหมู", icon: "🍣" },
  { id: "s3", nameTh: "ไก่ทอดเกาหลีซอสการ์ลิค", icon: "🍲" },
  { id: "s4", nameTh: "ติ่มซำ ฮะเก๋า & ขนมจีบ", icon: "🥟" },
  { id: "s5", nameTh: "สปาเกตตีคาโบนาร่า", icon: "🍝" },
  { id: "s6", nameTh: "สแมชชีสเบอร์เกอร์", icon: "🍔" },
];

export function RandomizerClient({
  initialCategories,
  initialBudget,
  initialMealType,
  radiusKm,
  lat,
  lng,
  area,
}: RandomizerClientProps) {
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [budget, setBudget] = useState<string>(initialBudget);
  const [mealType, setMealType] = useState<string>(initialMealType);
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [spinTicker, setSpinTicker] = useState<{ nameTh: string; icon: string }>(
    FALLBACK_SPIN_ITEMS[0]
  );
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);
  const [history, setHistory] = useState<MenuItem[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [totalMatching, setTotalMatching] = useState<number>(0);
  const [remainingCandidates, setRemainingCandidates] = useState<number>(0);
  const [exhausted, setExhausted] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<"database" | "mock-catalog" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didInitialRoll = useRef(false);

  const sessionToken = useMemo(() => {
    if (typeof window === "undefined") return "guest-ssr";
    const key = "fr_guest_session";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `guest-${Math.random().toString(36).slice(2, 12)}`;
    window.sessionStorage.setItem(key, created);
    return created;
  }, []);

  const stopSpinAnimation = useCallback(() => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  }, []);

  const rollFood = useCallback(
    async (overrideExclude?: string[]) => {
      setIsSpinning(true);
      setError(null);
      setExhausted(false);
      setImgError(false);

      // Start roulette ticker animation
      stopSpinAnimation();
      let tick = 0;
      const pool = FALLBACK_SPIN_ITEMS;
      spinIntervalRef.current = setInterval(() => {
        tick = (tick + 1) % pool.length;
        setSpinTicker(pool[tick]);
      }, 95);

      const excludeList =
        overrideExclude !== undefined
          ? overrideExclude
          : noRepeat
            ? excludedIds
            : [];

      const startTime = Date.now();

      try {
        const res = await fetch("/api/v1/menus/random", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: selectedCategories,
            priceTier: budget,
            mealType,
            excludeMenuIds: excludeList,
            sessionToken,
            ...(lat && lng
              ? { latitude: Number(lat), longitude: Number(lng) }
              : {}),
          }),
        });

        const json: RandomApiResponse = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message || "ไม่สามารถสุ่มเมนูอาหารได้");
        }

        // Let the roulette animation spin for at least 950ms for satisfying feedback
        const elapsed = Date.now() - startTime;
        const previewPool =
          json.data.candidatesPreview.length > 0
            ? json.data.candidatesPreview
            : FALLBACK_SPIN_ITEMS;

        if (elapsed < 950) {
          stopSpinAnimation();
          let idx = 0;
          spinIntervalRef.current = setInterval(() => {
            idx = (idx + 1) % previewPool.length;
            setSpinTicker(previewPool[idx]);
          }, 85);
          await new Promise((resolve) => setTimeout(resolve, 950 - elapsed));
        }

        stopSpinAnimation();
        setDataSource(json.meta?.source ?? null);
        setTotalMatching(json.data.totalMatching);
        setRemainingCandidates(json.data.remainingCandidates);
        setExhausted(json.data.exhausted);

        if (json.data.menu) {
          const picked = json.data.menu;
          setCurrentMenu(picked);
          setExcludedIds((prev) =>
            prev.includes(picked.id) ? prev : [...prev, picked.id]
          );
          setHistory((prev) => [
            picked,
            ...prev.filter((item) => item.id !== picked.id),
          ].slice(0, 6));
        } else {
          setCurrentMenu(null);
        }
      } catch (err) {
        stopSpinAnimation();
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบสุ่ม"
        );
      } finally {
        setIsSpinning(false);
      }
    },
    [
      budget,
      excludedIds,
      lat,
      lng,
      mealType,
      noRepeat,
      selectedCategories,
      sessionToken,
      stopSpinAnimation,
    ]
  );

  useEffect(() => {
    if (!didInitialRoll.current) {
      didInitialRoll.current = true;
      rollFood([]);
    }
    return () => stopSpinAnimation();
  }, [rollFood, stopSpinAnimation]);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  }

  function handleResetFiltersAndRoll() {
    setSelectedCategories([]);
    setBudget("ANY");
    setMealType("ANY");
    setExcludedIds([]);
  }

  function handleResetHistoryAndRoll() {
    setExcludedIds([]);
    rollFood([]);
  }

  function buildRestaurantSearchHref(menu: MenuItem) {
    const params = new URLSearchParams();
    params.set("menuId", menu.id);
    params.set("menuSlug", menu.slug);
    params.set("menuName", menu.nameTh);
    params.set("radiusKm", radiusKm);
    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
    }
    if (area) {
      params.set("area", area);
    }
    return `/restaurants?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              showFilters
                ? "border-orange-500 bg-orange-50 text-orange-800"
                : "border-border-subtle bg-surface text-stone-700 hover:bg-stone-50"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            ปรับตัวกรอง
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-xs font-medium text-stone-700">
            <input
              type="checkbox"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-orange-600"
            />
            ไม่สุ่มเมนูเดิมซ้ำ
          </label>
        </div>
      </div>

      {/* Collapsible Quick Filter Drawer */}
      {showFilters && (
        <div className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-stone-700">หมวดหมู่อาหาร</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FOOD_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-orange-500 bg-orange-50 text-orange-800"
                          : "border-border-subtle text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {cat.icon} {cat.nameTh}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-stone-700">งบประมาณ</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBudget(opt.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        budget === opt.id
                          ? "border-orange-500 bg-orange-600 text-white"
                          : "border-border-subtle text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {opt.labelTh}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-700">มื้ออาหาร</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MEAL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMealType(opt.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        mealType === opt.id
                          ? "border-orange-500 bg-orange-600 text-white"
                          : "border-border-subtle text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {opt.labelTh}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
              <button
                type="button"
                onClick={handleResetFiltersAndRoll}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                ล้างตัวกรอง
              </button>
              <button
                type="button"
                onClick={() => {
                  setExcludedIds([]);
                  setShowFilters(false);
                  rollFood([]);
                }}
                className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
              >
                ใช้ตัวกรองและสุ่มใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Roulette Card */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-lg shadow-orange-950/5">
        {isSpinning ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center bg-gradient-to-b from-orange-50/80 to-surface p-8 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-5xl shadow-lg shadow-orange-500/25 animate-bounce">
              <span aria-hidden="true">{spinTicker.icon}</span>
            </div>
            <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              กำลังหมุนวงล้อสุ่มอาหาร...
            </p>
            <div className="mt-2 min-h-[2.25rem] text-2xl font-bold text-stone-900">
              {spinTicker.nameTh}
            </div>
            <p className="mt-2 text-xs text-stone-500">
              คัดเลือกเมนูที่ตรงกับเงื่อนไขของคุณ
            </p>
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState
              title="เกิดข้อผิดพลาดในการสุ่มอาหาร"
              message={error}
              onRetry={() => rollFood()}
            />
          </div>
        ) : exhausted ? (
          <div className="p-6">
            <EmptyState
              title={`สุ่มครบทุกเมนูที่ตรงเงื่อนไขแล้ว (${totalMatching} เมนู)`}
              description="คุณเปิดโหมดไม่สุ่มเมนูเดิมซ้ำไว้ และได้สุ่มดูครบทุกเมนูในเงื่อนไขนี้แล้ว สามารถรีเซ็ตประวัติเพื่อสุ่มใหม่อีกครั้งได้"
              action={
                <button
                  type="button"
                  onClick={handleResetHistoryAndRoll}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  รีเซ็ตประวัติแล้วสุ่มใหม่
                </button>
              }
            />
          </div>
        ) : !currentMenu ? (
          <div className="p-6">
            <EmptyState
              title="ไม่พบเมนูที่ตรงกับเงื่อนไขทั้งหมด"
              description="ลองขยายช่วงงบประมาณ เลือกหมวดหมู่เพิ่มเติม หรือเปลี่ยนประเภทมื้ออาหารเพื่อให้ระบบมีตัวเลือกมากขึ้น"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setBudget("ANY");
                    setMealType("ANY");
                    setExcludedIds([]);
                    setShowFilters(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  ปรับเงื่อนไขใหม่
                </button>
              }
            />
          </div>
        ) : (
          <div>
            {/* Dish Hero Image */}
            <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 sm:h-80">
              {currentMenu.imageUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentMenu.imageUrl}
                  alt={currentMenu.nameTh}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-6xl">
                  <span>{currentMenu.category.icon}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

              {/* Top Badges */}
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm backdrop-blur">
                  <span>{currentMenu.category.icon}</span>
                  {currentMenu.category.nameTh}
                </span>
                {dataSource && (
                  <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {dataSource === "database"
                      ? "PostgreSQL Database"
                      : "Mock Catalog Fallback"}
                  </span>
                )}
              </div>

              {/* Bottom Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-medium text-orange-200">
                  เมนูที่คุณสุ่มได้วันนี้
                </p>
                <h1 className="mt-0.5 text-2xl font-bold leading-tight sm:text-3xl">
                  {currentMenu.nameTh}
                </h1>
                <p className="text-xs text-stone-200 sm:text-sm">
                  {currentMenu.nameEn}
                </p>
              </div>
            </div>

            {/* Dish Details */}
            <div className="p-5 sm:p-7">
              <p className="text-sm leading-relaxed text-stone-700 sm:text-base">
                {currentMenu.descriptionTh}
              </p>

              {/* Price & Meal Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
                  <Tag className="h-3.5 w-3.5" />
                  ฿{currentMenu.minPrice} – ฿{currentMenu.maxPrice} (
                  {PRICE_TIER_LABELS[currentMenu.priceTier] ?? currentMenu.priceTier})
                </span>
                {currentMenu.mealTypes.map((mt) => (
                  <span
                    key={mt}
                    className="rounded-xl bg-surface-muted px-2.5 py-1.5 text-xs font-medium text-stone-600"
                  >
                    {MEAL_LABELS[mt] ?? mt}
                  </span>
                ))}
              </div>

              {/* Stats bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                <span>
                  เมนูที่ตรงเงื่อนไขทั้งหมด {totalMatching} เมนู
                  {noRepeat ? ` • เหลืออีก ${remainingCandidates} เมนูที่ยังไม่ซ้ำ` : ""}
                </span>
                {area && <span>พื้นที่ค้นหา: {area} ({radiusKm} กม.)</span>}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={buildRestaurantSearchHref(currentMenu)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:from-orange-700 hover:to-amber-600"
                >
                  <Compass className="h-4 w-4" />
                  ค้นหาร้านที่ขายเมนูนี้
                </Link>

                <button
                  type="button"
                  onClick={() => rollFood()}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-surface px-5 py-3.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
                >
                  <Dices className="h-4 w-4 text-orange-600" />
                  สุ่มใหม่อีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Roll History */}
      {history.length > 1 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
              <History className="h-4 w-4 text-orange-500" />
              เมนูที่เพิ่งสุ่มไปในรอบนี้
            </h2>
            <button
              type="button"
              onClick={handleResetHistoryAndRoll}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              ล้างประวัติกันซ้ำ
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {history.map((item) => {
              const isCurrent = currentMenu?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentMenu(item);
                    setImgError(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-3 text-left transition-colors",
                    isCurrent
                      ? "border-orange-500 bg-orange-50/70"
                      : "border-border-subtle bg-surface hover:border-orange-300"
                  )}
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.category.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-stone-900">
                      {item.nameTh}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      ฿{item.minPrice}–฿{item.maxPrice}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
