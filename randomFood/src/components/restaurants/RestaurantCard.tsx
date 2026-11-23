"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  ExternalLink,
  FlaskConical,
  HelpCircle,
  MapPin,
  Navigation,
  Phone,
  ShoppingBag,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { buildDeliveryLinks } from "@/lib/delivery-links";
import { buildGoogleMapsDirectionsUrl, formatDistanceTh } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { RestaurantDTO } from "@/server/types/restaurant";

interface RestaurantCardProps {
  restaurant: RestaurantDTO;
  detailHref?: string;
  isSelected?: boolean;
  onSelectOnMap?: (restaurant: RestaurantDTO) => void;
}

function renderPriceLevelSymbols(level: number | null): string {
  if (!level) return "ไม่ระบุ";
  return "฿".repeat(Math.min(Math.max(level, 1), 4));
}

export function RestaurantCard({
  restaurant,
  detailHref,
  isSelected = false,
  onSelectOnMap,
}: RestaurantCardProps) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = restaurant.photoUrls[0] ?? null;
  const resolvedDetailHref = detailHref || `/restaurants/${encodeURIComponent(restaurant.id)}`;

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    restaurant.latitude,
    restaurant.longitude,
    restaurant.name
  );
  const deliveryLinks = buildDeliveryLinks(restaurant.name);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-surface transition-all hover:shadow-md",
        isSelected
          ? "border-orange-500 ring-2 ring-orange-500/20"
          : "border-border-subtle hover:border-orange-300"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Restaurant Photo */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 sm:h-auto sm:w-52">
          {photoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={restaurant.name}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[11rem] w-full flex-col items-center justify-center text-orange-400">
              <Store className="h-10 w-10" />
              <span className="mt-1 text-[11px] font-medium text-stone-500">
                ไม่มีรูปภาพร้าน
              </span>
            </div>
          )}

          {/* Top Left: Open Status */}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {restaurant.openingHours.isOpenNow === true && (
              <span className="rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                เปิดอยู่
              </span>
            )}
            {restaurant.openingHours.isOpenNow === false && (
              <span className="rounded-full bg-stone-800/85 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                ปิดอยู่
              </span>
            )}
          </div>

          {/* Bottom Left: Data Source Transparency Badge */}
          <div className="absolute bottom-2.5 left-2.5">
            {restaurant.isMockData ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/95 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900 shadow-sm">
                <FlaskConical className="h-3 w-3" />
                ข้อมูลจำลอง (Mock)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                {restaurant.dataSource === "GOOGLE_PLACES"
                  ? "Google Places"
                  : "ฐานข้อมูลระบบ"}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            {/* Name, Match Score & Distance */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={resolvedDetailHref}
                  className="text-base font-bold leading-snug text-stone-900 transition-colors hover:text-orange-600 sm:text-lg"
                >
                  {restaurant.name}
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {typeof restaurant.matchScore === "number" && (
                  <span
                    title="คะแนนการจัดอันดับรวม (ความตรงเมนู + คะแนนรีวิว + ระยะทาง + สถานะเปิด)"
                    className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700"
                  >
                    คะแนน {restaurant.matchScore}/100
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                  <Navigation className="h-3 w-3" />
                  {formatDistanceTh(restaurant.distanceKm)}
                </span>
              </div>
            </div>

            {/* Address */}
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-stone-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
              <span>{restaurant.address}</span>
            </p>

            {/* Menu Verification Badge (Rule 3: Strictly shown ONLY with evidence) */}
            {restaurant.menuMatch && (
              <div
                className={cn(
                  "mt-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs",
                  restaurant.menuMatch.verificationStatus === "VERIFIED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                )}
              >
                {restaurant.menuMatch.verificationStatus === "VERIFIED" ? (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <HelpCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                )}
                <span className="font-semibold">
                  {restaurant.menuMatch.verificationStatus === "VERIFIED"
                    ? `ยืนยันเมนู: ${restaurant.menuMatch.menuNameTh}`
                    : `คาดการณ์ว่ามีเมนู: ${restaurant.menuMatch.menuNameTh}`}
                </span>
                {restaurant.menuMatch.matchedPrice !== null && (
                  <span className="rounded bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold">
                    ฿{restaurant.menuMatch.matchedPrice}
                  </span>
                )}
                <span className="text-[10px] opacity-80">
                  ({restaurant.menuMatch.verificationStatus})
                </span>
              </div>
            )}

            {/* Strictly Separated Ratings (Rule 4: Google vs Food Roulette Web Reviews) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>
                  {restaurant.googleRating !== null
                    ? restaurant.googleRating.toFixed(1)
                    : "–"}
                </span>
                <span className="font-normal text-stone-500">
                  ({restaurant.googleReviewCount.toLocaleString()} รีวิว Google)
                </span>
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-stone-700">
                <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                {restaurant.appReviewCount > 0 && restaurant.appRatingAvg !== null ? (
                  <>
                    <span className="font-semibold">
                      {restaurant.appRatingAvg.toFixed(1)}
                    </span>
                    <span className="text-stone-500">
                      ({restaurant.appReviewCount} รีวิวบนเว็บ)
                    </span>
                  </>
                ) : (
                  <span className="text-stone-500">ยังไม่มีรีวิวบนเว็บ</span>
                )}
              </div>
            </div>

            {/* Price & Hours & Phone */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-stone-400" />
                {restaurant.estimatedMinPrice !== null &&
                restaurant.estimatedMaxPrice !== null
                  ? `฿${restaurant.estimatedMinPrice}–฿${restaurant.estimatedMaxPrice}`
                  : renderPriceLevelSymbols(restaurant.priceLevel)}
                {restaurant.priceLevel && (
                  <span className="text-stone-400">
                    ({renderPriceLevelSymbols(restaurant.priceLevel)})
                  </span>
                )}
              </span>

              {restaurant.openingHours.todayHours && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  {restaurant.openingHours.todayHours}
                </span>
              )}

              {restaurant.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  {restaurant.phone}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {deliveryLinks.map((link) => (
                <a
                  key={link.provider}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={
                    link.isVerifiedDirectUrl
                      ? link.label
                      : `${link.label} (หน้าค้นหา)`
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-muted/60 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                >
                  <ShoppingBag className="h-3 w-3 text-orange-600" />
                  {link.shortLabel}
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSelectOnMap && (
                <button
                  type="button"
                  onClick={() => onSelectOnMap(restaurant)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  ดูบนแผนที่
                </button>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
              >
                Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Link
                href={resolvedDetailHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700"
              >
                ดูรายละเอียดร้าน
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
