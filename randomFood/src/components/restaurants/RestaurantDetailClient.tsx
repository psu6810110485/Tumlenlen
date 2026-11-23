"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  ExternalLink,
  FlaskConical,
  HelpCircle,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  ShoppingBag,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { buildGoogleMapsDirectionsUrl, formatDistanceTh } from "@/lib/geo";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { EmptyState } from "@/components/ui/StateViews";
import type { RestaurantDetailDTO } from "@/server/types/restaurant";

interface RestaurantDetailClientProps {
  restaurant: RestaurantDetailDTO;
  backHref: string;
  highlightMenuSlug?: string;
}

function renderPriceLevelSymbols(level: number | null): string {
  if (!level) return "ไม่ระบุ";
  return "฿".repeat(Math.min(Math.max(level, 1), 4));
}

export function RestaurantDetailClient({
  restaurant,
  backHref,
  highlightMenuSlug,
}: RestaurantDetailClientProps) {
  const [imgError, setImgError] = useState(false);
  const coverPhoto = restaurant.photoUrls[0] ?? null;

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    restaurant.latitude,
    restaurant.longitude,
    restaurant.name
  );

  const verifiedMenus = restaurant.matchedMenus.filter(
    (m) => m.verificationStatus === "VERIFIED"
  );
  const inferredMenus = restaurant.matchedMenus.filter(
    (m) => m.verificationStatus === "INFERRED"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้ารายการร้านอาหาร
        </Link>

        {restaurant.isMockData ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            <FlaskConical className="h-3.5 w-3.5" />
            ข้อมูลร้านจำลอง (Mock Mode)
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {restaurant.dataSource === "GOOGLE_PLACES"
              ? "Google Places (Live)"
              : "ฐานข้อมูลระบบ"}
          </span>
        )}
      </div>

      {/* Hero Cover Card */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-sm">
        <div className="relative h-60 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 sm:h-80">
          {coverPhoto && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPhoto}
              alt={restaurant.name}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-orange-400">
              <Store className="h-14 w-14" />
              <span className="mt-2 text-xs font-medium text-stone-500">
                ยังไม่มีรูปภาพร้านอาหาร
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Status pills */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {restaurant.openingHours.isOpenNow === true && (
              <span className="rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                เปิดให้บริการอยู่
              </span>
            )}
            {restaurant.openingHours.isOpenNow === false && (
              <span className="rounded-full bg-stone-800/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                ปิดให้บริการในขณะนี้
              </span>
            )}
            {restaurant.distanceKm !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-orange-700 shadow-sm">
                <Navigation className="h-3.5 w-3.5" />
                ห่าง {formatDistanceTh(restaurant.distanceKm)}
              </span>
            )}
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-stone-200 sm:text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <span>{restaurant.address}</span>
            </p>
          </div>
        </div>

        {/* Key Facts Row */}
        <div className="grid gap-4 border-t border-border-subtle p-5 sm:grid-cols-3 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">ราคาโดยประมาณ</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900">
                {restaurant.estimatedMinPrice !== null &&
                restaurant.estimatedMaxPrice !== null
                  ? `฿${restaurant.estimatedMinPrice} – ฿${restaurant.estimatedMaxPrice}`
                  : renderPriceLevelSymbols(restaurant.priceLevel)}
              </p>
              {restaurant.priceLevel && (
                <p className="text-[11px] text-stone-500">
                  ระดับราคา {renderPriceLevelSymbols(restaurant.priceLevel)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">เวลาเปิด–ปิดวันนี้</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900">
                {restaurant.openingHours.todayHours || "ไม่ระบุเวลาทำการ"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">เบอร์โทรศัพท์</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900">
                {restaurant.phone || "ไม่ระบุหมายเลขโทรศัพท์"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Column: Menu Verification & Reviews */}
        <div className="space-y-6 lg:col-span-8">
          {/* Menu Verification Section (Strict VERIFIED vs INFERRED separation) */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  รายการเมนูที่จับคู่กับร้านนี้
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  แยกเมนูที่ยืนยันหลักฐานแล้ว (VERIFIED) ออกจากเมนูที่ระบบคาดการณ์ (INFERRED) อย่างชัดเจน
                </p>
              </div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-stone-700">
                {restaurant.matchedMenus.length} เมนูที่มีหลักฐาน
              </span>
            </div>

            {restaurant.matchedMenus.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="ยังไม่มีข้อมูลยืนยันเมนูสำหรับร้านนี้"
                description="ระบบจะไม่แสดงว่าร้านขายเมนูใดหากยังไม่มีหลักฐานรองรับ เพื่อความโปร่งใสของข้อมูล"
              />
            ) : (
              <div className="mt-5 space-y-5">
                {/* Verified Menus */}
                {verifiedMenus.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      เมนูที่ยืนยันแล้ว (VERIFIED)
                    </h3>
                    <div className="mt-2.5 space-y-2.5">
                      {verifiedMenus.map((item) => {
                        const isHighlighted = item.menuSlug === highlightMenuSlug;
                        return (
                          <div
                            key={item.menuSlug}
                            className={cn(
                              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5",
                              isHighlighted
                                ? "border-emerald-400 bg-emerald-50/70"
                                : "border-emerald-200/80 bg-emerald-50/30"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CategoryIcon slug={item.categorySlug} className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-stone-900">
                                    {item.menuNameTh}
                                  </p>
                                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    VERIFIED
                                  </span>
                                </div>
                                <p className="text-xs text-stone-500">
                                  {item.menuNameEn}
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-800/90">
                                  แหล่งอ้างอิง: {item.evidenceSource}
                                </p>
                              </div>
                            </div>

                            {item.price !== null && (
                              <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-stone-900 shadow-xs">
                                ฿{item.price}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Inferred Menus */}
                {inferredMenus.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                      <HelpCircle className="h-4 w-4 text-amber-600" />
                      เมนูที่ระบบคาดการณ์ (INFERRED)
                    </h3>
                    <div className="mt-2.5 space-y-2.5">
                      {inferredMenus.map((item) => {
                        const isHighlighted = item.menuSlug === highlightMenuSlug;
                        return (
                          <div
                            key={item.menuSlug}
                            className={cn(
                              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5",
                              isHighlighted
                                ? "border-amber-400 bg-amber-50/80"
                                : "border-amber-200/80 bg-amber-50/30"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <CategoryIcon slug={item.categorySlug} className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-stone-900">
                                    {item.menuNameTh}
                                  </p>
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                    INFERRED
                                  </span>
                                </div>
                                <p className="text-xs text-stone-500">
                                  {item.menuNameEn}
                                </p>
                                <p className="mt-1 text-[11px] text-amber-900/85">
                                  เหตุผลการคาดการณ์: {item.evidenceSource}
                                </p>
                              </div>
                            </div>

                            {item.price !== null && (
                              <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-stone-700">
                                ประมาณ ฿{item.price}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Strictly Separated Ratings & Web Reviews (Rule 4) */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-stone-900">
              คะแนนและรีวิว (แยกแหล่งที่มาชัดเจน)
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Google Places Rating */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs font-semibold text-amber-900">
                  คะแนนจาก Google Places
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-bold text-stone-900">
                    {restaurant.googleRating !== null
                      ? restaurant.googleRating.toFixed(1)
                      : "–"}
                  </span>
                  <span className="text-xs text-stone-500">
                    / 5.0 ({restaurant.googleReviewCount.toLocaleString()} รีวิว)
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  แสดงแยกจากรีวิวของผู้ใช้ Food Roulette ตามข้อกำหนดแหล่งข้อมูลภายนอก
                </p>
              </div>

              {/* Food Roulette App Rating */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
                <p className="text-xs font-semibold text-orange-900">
                  คะแนนจากผู้ใช้ Food Roulette
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                  <span className="text-2xl font-bold text-stone-900">
                    {restaurant.appRatingAvg !== null && restaurant.appReviewCount > 0
                      ? restaurant.appRatingAvg.toFixed(1)
                      : "–"}
                  </span>
                  <span className="text-xs text-stone-500">
                    ({restaurant.appReviewCount} รีวิวบนเว็บไซต์)
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  ระบบเขียนรีวิวและบันทึกร้านโปรดจะเปิดใช้งานเต็มรูปแบบใน Phase 5
                </p>
              </div>
            </div>

            {/* Web Reviews List */}
            <div className="mt-5 border-t border-border-subtle pt-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                รีวิวจากสมาชิกบนเว็บไซต์
              </h3>

              {restaurant.appReviews.length === 0 ? (
                <p className="mt-2 rounded-2xl bg-surface-muted/60 p-4 text-xs text-stone-500">
                  ยังไม่มีรีวิวจากสมาชิก Food Roulette สำหรับร้านนี้ (ระบบไม่นำรีวิวภายนอกมาแสดงปะปน)
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {restaurant.appReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-border-subtle p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-900">
                          {review.authorName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                          <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                          {review.rating}.0
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Actions, Delivery & Opening Hours */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Navigation & Delivery */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-stone-900">
              นำทาง &amp; สั่งอาหาร
            </h2>

            <div className="mt-4 space-y-2.5">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                <Navigation className="h-4 w-4" />
                เปิดแผนที่นำทาง Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {restaurant.deliveryLinks.map((link) => (
                <a
                  key={link.provider}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-xs font-semibold text-stone-800 transition-colors hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                    <span>{link.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500">
                    {link.isVerifiedDirectUrl ? "ลิงก์ตรง" : "ค้นหา"}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
              หากยังไม่มี URL ร้านโดยตรงที่ยืนยันแล้ว ระบบจะเปิดหน้าค้นหาด้วยชื่อร้านแทน (ไม่สร้างลิงก์ปลอม)
            </p>
          </section>

          {/* Opening Hours */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
              <Clock className="h-4 w-4 text-orange-600" />
              เวลาทำการ
            </h2>
            {restaurant.openingHours.weekdayText.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs text-stone-600">
                {restaurant.openingHours.weekdayText.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-stone-500">
                ยังไม่มีข้อมูลเวลาทำการรายวันสำหรับร้านนี้
              </p>
            )}

            <div className="mt-4 border-t border-border-subtle pt-3 text-[11px] text-stone-400">
              พิกัด: {restaurant.latitude.toFixed(5)}, {restaurant.longitude.toFixed(5)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
