import type { PriceTier } from "@prisma/client";
import { getServerEnv, type ExternalApiMode } from "@/lib/env";
import { calculateDistanceKm } from "@/lib/geo";
import { placesCache } from "@/server/cache/memory-cache";
import { MOCK_RESTAURANTS } from "@/server/data/mock-restaurants";
import type {
  ResolvedMenuContext,
  RestaurantDTO,
} from "@/server/types/restaurant";

const GOOGLE_PLACES_NEARBY_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
const GOOGLE_PLACES_TEXT_URL =
  "https://places.googleapis.com/v1/places:searchText";

const GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.photos",
  "places.types",
  "places.nationalPhoneNumber",
].join(",");

export class ExternalPlacesApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "ExternalPlacesApiError";
    this.statusCode = statusCode;
  }
}

export interface PlacesAdapterSearchInput {
  latitude: number;
  longitude: number;
  radiusKm: number;
  menu?: ResolvedMenuContext | null;
  limit?: number;
}

export interface PlacesAdapterSearchOutput {
  restaurants: RestaurantDTO[];
  mode: ExternalApiMode;
  cacheHit: boolean;
}

interface GooglePlaceApiItem {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  photos?: Array<{ name?: string }>;
  types?: string[];
  nationalPhoneNumber?: string;
}

function mapGooglePriceLevel(raw?: string): {
  priceLevel: number | null;
  priceTier: PriceTier | null;
  minPrice: number | null;
  maxPrice: number | null;
} {
  switch (raw) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return { priceLevel: 1, priceTier: "BUDGET", minPrice: 50, maxPrice: 100 };
    case "PRICE_LEVEL_MODERATE":
      return { priceLevel: 2, priceTier: "MODERATE", minPrice: 110, maxPrice: 300 };
    case "PRICE_LEVEL_EXPENSIVE":
      return { priceLevel: 3, priceTier: "PREMIUM", minPrice: 320, maxPrice: 700 };
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return { priceLevel: 4, priceTier: "PREMIUM", minPrice: 700, maxPrice: 1500 };
    default:
      return { priceLevel: null, priceTier: null, minPrice: null, maxPrice: null };
  }
}

function inferCategoriesFromGoogleTypes(types: string[] = []): string[] {
  const joined = types.join(" ").toLowerCase();
  const categories: string[] = [];
  if (joined.includes("thai")) categories.push("thai");
  if (joined.includes("japanese") || joined.includes("ramen") || joined.includes("sushi")) {
    categories.push("japanese");
  }
  if (joined.includes("korean")) categories.push("korean");
  if (joined.includes("chinese") || joined.includes("dim_sum")) {
    categories.push("chinese");
  }
  if (joined.includes("italian") || joined.includes("pizza") || joined.includes("pasta")) {
    categories.push("italian");
  }
  if (joined.includes("fast_food") || joined.includes("burger") || joined.includes("hamburger")) {
    categories.push("fast-food");
  }
  return categories;
}

function extractTodayHours(weekdayDescriptions?: string[]): string | null {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) return null;
  // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat; Google weekdayDescriptions starts Monday = 0
  const jsDay = new Date().getDay();
  const googleIdx = jsDay === 0 ? 6 : jsDay - 1;
  const line = weekdayDescriptions[googleIdx] ?? weekdayDescriptions[0];
  if (!line) return null;
  const colonIdx = line.indexOf(":");
  return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : line;
}

export function buildStreetViewFallbackUrl(
  latitude: number,
  longitude: number
): string {
  return `/api/v1/places/streetview?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`;
}

function buildCacheKey(mode: ExternalApiMode, input: PlacesAdapterSearchInput): string {
  const latKey = input.latitude.toFixed(3);
  const lngKey = input.longitude.toFixed(3);
  const menuKey = input.menu?.slug ?? "any";
  return `places:${mode}:${latKey}:${lngKey}:${input.radiusKm}:${menuKey}`;
}

function searchMockRestaurants(
  input: PlacesAdapterSearchInput
): RestaurantDTO[] {
  const results: RestaurantDTO[] = [];

  for (const item of MOCK_RESTAURANTS) {
    const distanceKm = calculateDistanceKm(
      input.latitude,
      input.longitude,
      item.latitude,
      item.longitude
    );

    if (distanceKm > input.radiusKm) continue;

    // Strictly attach menuMatch ONLY if mock evidence exists for the requested menu (Rule 3)
    let menuMatch: RestaurantDTO["menuMatch"] = null;
    if (input.menu) {
      const evidence = item.menuEvidence.find(
        (ev) => ev.menuSlug === input.menu?.slug
      );
      if (evidence) {
        menuMatch = {
          menuId: input.menu.id,
          menuSlug: input.menu.slug,
          menuNameTh: input.menu.nameTh,
          verificationStatus: evidence.verificationStatus,
          evidenceSource: evidence.evidenceSource,
          matchedPrice: evidence.price,
        };
      }
    }

    results.push({
      id: item.id,
      googlePlaceId: null,
      name: item.name,
      address: item.address,
      province: item.province,
      district: item.district,
      latitude: item.latitude,
      longitude: item.longitude,
      distanceKm,
      phone: item.phone,
      priceLevel: item.priceLevel,
      priceTier: item.priceTier,
      estimatedMinPrice: item.estimatedMinPrice,
      estimatedMaxPrice: item.estimatedMaxPrice,
      googleRating: item.googleRating,
      googleReviewCount: item.googleReviewCount,
      appRatingAvg: item.appRatingAvg,
      appReviewCount: item.appReviewCount,
      openingHours: item.openingHours,
      photoUrls: item.photoUrls,
      categories: item.categories,
      dataSource: "MOCK",
      isMockData: true,
      menuMatch,
    });
  }

  return results;
}

async function searchGooglePlacesLive(
  input: PlacesAdapterSearchInput,
  apiKey: string
): Promise<RestaurantDTO[]> {
  const radiusMeters = Math.min(Math.max(input.radiusKm * 1000, 500), 50000);
  const maxResultCount = Math.min(Math.max(input.limit ?? 20, 1), 20);

  const useTextSearch = Boolean(input.menu);
  const endpoint = useTextSearch ? GOOGLE_PLACES_TEXT_URL : GOOGLE_PLACES_NEARBY_URL;

  const payload = useTextSearch
    ? {
        textQuery: input.menu!.searchKeywords[0] || input.menu!.nameTh,
        includedType: "restaurant",
        languageCode: "th",
        regionCode: "TH",
        maxResultCount,
        locationBias: {
          circle: {
            center: {
              latitude: input.latitude,
              longitude: input.longitude,
            },
            radius: radiusMeters,
          },
        },
      }
    : {
        includedTypes: ["restaurant"],
        languageCode: "th",
        regionCode: "TH",
        maxResultCount,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: {
              latitude: input.latitude,
              longitude: input.longitude,
            },
            radius: radiusMeters,
          },
        },
      };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (err) {
    throw new ExternalPlacesApiError(
      `ไม่สามารถเชื่อมต่อ Google Places API ได้: ${
        err instanceof Error ? err.message : "Network error"
      }`,
      502
    );
  }

  if (!response.ok) {
    const errorSnippet = await response.text().catch(() => "");
    console.error("[GooglePlacesAdapter] Non-OK response:", response.status, errorSnippet.slice(0, 300));
    throw new ExternalPlacesApiError(
      `Google Places API ตอบกลับสถานะผิดพลาด (${response.status})`,
      502
    );
  }

  const data = (await response.json()) as { places?: GooglePlaceApiItem[] };
  const places = Array.isArray(data.places) ? data.places : [];

  const mapped: RestaurantDTO[] = [];

  for (const place of places) {
    const placeLat = place.location?.latitude;
    const placeLng = place.location?.longitude;
    if (placeLat === undefined || placeLng === undefined || !place.id) continue;

    const distanceKm = calculateDistanceKm(
      input.latitude,
      input.longitude,
      placeLat,
      placeLng
    );

    if (distanceKm > input.radiusKm) continue;

    const price = mapGooglePriceLevel(place.priceLevel);
    const hoursSource = place.currentOpeningHours ?? place.regularOpeningHours;
    const weekdayText = hoursSource?.weekdayDescriptions ?? [];

    // Proxy photo references through our server route so GOOGLE_PLACES_API_KEY is never exposed to frontend
    const placePhotos = (place.photos ?? [])
      .slice(0, 3)
      .map((p) => p.name)
      .filter((name): name is string => Boolean(name))
      .map(
        (name) =>
          `/api/v1/places/photo?name=${encodeURIComponent(name)}&maxWidthPx=800`
      );
    const photoUrls =
      placePhotos.length > 0
        ? placePhotos
        : [buildStreetViewFallbackUrl(placeLat, placeLng)];

    // If searched via text query for a specific menu, mark strictly as INFERRED (never VERIFIED without menu proof)
    let menuMatch: RestaurantDTO["menuMatch"] = null;
    if (input.menu) {
      const displayName = (place.displayName?.text ?? "").toLowerCase();
      const matchedKeyword = input.menu.searchKeywords.find((kw) =>
        displayName.includes(kw.toLowerCase())
      );
      if (matchedKeyword) {
        menuMatch = {
          menuId: input.menu.id,
          menuSlug: input.menu.slug,
          menuNameTh: input.menu.nameTh,
          verificationStatus: "INFERRED",
          evidenceSource: `Google Places Text Match ("${matchedKeyword}")`,
          matchedPrice: null,
        };
      }
    }

    mapped.push({
      id: `gplace-${place.id}`,
      googlePlaceId: place.id,
      name: place.displayName?.text ?? "ร้านอาหารไม่ระบุชื่อ",
      address: place.formattedAddress ?? "ไม่ระบุที่อยู่",
      province: null,
      district: null,
      latitude: placeLat,
      longitude: placeLng,
      distanceKm,
      phone: place.nationalPhoneNumber ?? null,
      priceLevel: price.priceLevel,
      priceTier: price.priceTier,
      estimatedMinPrice: price.minPrice,
      estimatedMaxPrice: price.maxPrice,
      googleRating: typeof place.rating === "number" ? place.rating : null,
      googleReviewCount: place.userRatingCount ?? 0,
      appRatingAvg: null,
      appReviewCount: 0,
      openingHours: {
        isOpenNow: hoursSource?.openNow ?? null,
        todayHours: extractTodayHours(weekdayText),
        weekdayText,
      },
      photoUrls,
      categories: inferCategoriesFromGoogleTypes(place.types),
      dataSource: "GOOGLE_PLACES",
      isMockData: false,
      menuMatch,
    });
  }

  return mapped;
}

/**
 * Searches nearby restaurants via Google Places API (New) in "live" mode
 * or clearly-labeled mock fixtures in "mock" mode, with short-term TTL caching.
 */
export async function searchPlacesNearby(
  input: PlacesAdapterSearchInput
): Promise<PlacesAdapterSearchOutput> {
  const env = getServerEnv();
  const mode = env.effectiveExternalMode;
  const ttlMs = env.PLACES_CACHE_TTL_SECONDS * 1000;
  const cacheKey = buildCacheKey(mode, input);

  const cached = placesCache.get(cacheKey) as RestaurantDTO[] | null;
  if (cached) {
    return {
      restaurants: cached,
      mode,
      cacheHit: true,
    };
  }

  if (mode === "live") {
    if (!env.hasGooglePlacesKey) {
      throw new ExternalPlacesApiError(
        "ไม่สามารถใช้งานโหมด Live ได้ เนื่องจากยังไม่ได้ตั้งค่า GOOGLE_PLACES_API_KEY",
        503
      );
    }

    const liveRestaurants = await searchGooglePlacesLive(
      input,
      env.GOOGLE_PLACES_API_KEY
    );
    placesCache.set(cacheKey, liveRestaurants, ttlMs);

    return {
      restaurants: liveRestaurants,
      mode: "live",
      cacheHit: false,
    };
  }

  const mockRestaurants = searchMockRestaurants(input);
  placesCache.set(cacheKey, mockRestaurants, ttlMs);

  return {
    restaurants: mockRestaurants,
    mode: "mock",
    cacheHit: false,
  };
}

const PLACE_DETAIL_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "currentOpeningHours",
  "regularOpeningHours",
  "photos",
  "types",
  "nationalPhoneNumber",
].join(",");

const PLACE_ID_REGEX = /^[A-Za-z0-9_-]{8,160}$/;

/**
 * Fetches full details for a single Google Place ID using Google Places API (New)
 * in "live" mode, with short-term TTL caching and proxied storefront photos.
 */
export async function fetchGooglePlaceDetail(
  placeId: string
): Promise<RestaurantDTO | null> {
  const env = getServerEnv();
  if (env.effectiveExternalMode !== "live" || !env.hasGooglePlacesKey) {
    return null;
  }
  if (!PLACE_ID_REGEX.test(placeId)) {
    return null;
  }

  const cacheKey = `place-detail:live:${placeId}`;
  const cached = placesCache.get(cacheKey) as RestaurantDTO | null;
  if (cached) return cached;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
    placeId
  )}?languageCode=th&regionCode=TH`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACE_DETAIL_FIELD_MASK,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new ExternalPlacesApiError(
      `ไม่สามารถโหลดรายละเอียดร้านจาก Google Places API ได้: ${
        err instanceof Error ? err.message : "Network error"
      }`,
      502
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ExternalPlacesApiError(
      `Google Places Detail API ตอบกลับสถานะผิดพลาด (${response.status})`,
      502
    );
  }

  const place = (await response.json()) as GooglePlaceApiItem;
  const placeLat = place.location?.latitude;
  const placeLng = place.location?.longitude;
  if (placeLat === undefined || placeLng === undefined || !place.id) {
    return null;
  }

  const price = mapGooglePriceLevel(place.priceLevel);
  const hoursSource = place.currentOpeningHours ?? place.regularOpeningHours;
  const weekdayText = hoursSource?.weekdayDescriptions ?? [];

  const placePhotos = (place.photos ?? [])
    .slice(0, 5)
    .map((p) => p.name)
    .filter((name): name is string => Boolean(name))
    .map(
      (name) =>
        `/api/v1/places/photo?name=${encodeURIComponent(name)}&maxWidthPx=800`
    );
  const photoUrls =
    placePhotos.length > 0
      ? placePhotos
      : [buildStreetViewFallbackUrl(placeLat, placeLng)];

  const dto: RestaurantDTO = {
    id: `gplace-${place.id}`,
    googlePlaceId: place.id,
    name: place.displayName?.text ?? "ร้านอาหารไม่ระบุชื่อ",
    address: place.formattedAddress ?? "ไม่ระบุที่อยู่",
    province: null,
    district: null,
    latitude: placeLat,
    longitude: placeLng,
    distanceKm: 0,
    phone: place.nationalPhoneNumber ?? null,
    priceLevel: price.priceLevel,
    priceTier: price.priceTier,
    estimatedMinPrice: price.minPrice,
    estimatedMaxPrice: price.maxPrice,
    googleRating: typeof place.rating === "number" ? place.rating : null,
    googleReviewCount: place.userRatingCount ?? 0,
    appRatingAvg: null,
    appReviewCount: 0,
    openingHours: {
      isOpenNow: hoursSource?.openNow ?? null,
      todayHours: extractTodayHours(weekdayText),
      weekdayText,
    },
    photoUrls,
    categories: inferCategoriesFromGoogleTypes(place.types),
    dataSource: "GOOGLE_PLACES",
    isMockData: false,
    menuMatch: null,
  };

  placesCache.set(cacheKey, dto, env.PLACES_CACHE_TTL_SECONDS * 1000);
  return dto;
}
