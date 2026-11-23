import type { DataSource, MenuVerificationStatus, PriceTier } from "@prisma/client";
import type { ExternalApiMode } from "@/lib/env";

export interface RestaurantOpeningHours {
  isOpenNow: boolean | null;
  todayHours: string | null;
  weekdayText: string[];
}

export interface RestaurantMenuMatchDTO {
  menuId: string;
  menuSlug: string;
  menuNameTh: string;
  verificationStatus: MenuVerificationStatus;
  evidenceSource: string;
  matchedPrice: number | null;
}

export interface RestaurantDTO {
  id: string;
  googlePlaceId: string | null;
  name: string;
  address: string;
  province: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone: string | null;
  priceLevel: number | null; // 1 - 4 scale
  priceTier: PriceTier | null;
  estimatedMinPrice: number | null;
  estimatedMaxPrice: number | null;
  // Strictly separated ratings (Rule 4)
  googleRating: number | null;
  googleReviewCount: number;
  appRatingAvg: number | null;
  appReviewCount: number;
  openingHours: RestaurantOpeningHours;
  photoUrls: string[];
  categories: string[];
  dataSource: DataSource;
  isMockData: boolean;
  // Strictly null unless evidence exists (Rule 3)
  menuMatch: RestaurantMenuMatchDTO | null;
}

export type RestaurantDataOrigin =
  | "postgis"
  | "google-places-live"
  | "postgis+google-places"
  | "mock-dataset";

export interface ResolvedMenuContext {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string;
  categorySlug: string;
  searchKeywords: string[];
}

export interface NearbyRestaurantsResult {
  restaurants: RestaurantDTO[];
  total: number;
  resolvedMenu: ResolvedMenuContext | null;
  mode: ExternalApiMode;
  dataOrigin: RestaurantDataOrigin;
  cacheHit: boolean;
  postgisUsed: boolean;
  center: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}
