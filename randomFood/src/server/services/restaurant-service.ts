import type { DataSource, PriceTier } from "@prisma/client";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { SEED_MENUS } from "@/server/data/menu-catalog";
import { searchPlacesNearby } from "@/server/adapters/google-places-adapter";
import {
  computeRestaurantRankScore,
  evaluateMenuMatch,
} from "@/server/services/matching-engine";
import type { NearbyRestaurantsQuery } from "@/server/validators/restaurant";
import type {
  NearbyRestaurantsResult,
  ResolvedMenuContext,
  RestaurantDataOrigin,
  RestaurantDTO,
  RestaurantOpeningHours,
} from "@/server/types/restaurant";

interface PostgisRestaurantRow {
  id: string;
  google_place_id: string | null;
  name: string;
  address: string;
  province: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  price_level: number | null;
  estimated_min_price: number | null;
  estimated_max_price: number | null;
  google_rating: number | null;
  google_review_count: number;
  app_rating_avg: number | null;
  app_review_count: number;
  opening_hours: unknown;
  photo_urls: string[] | null;
  data_source: DataSource;
  distance_meters: number;
}

function derivePriceTier(
  priceLevel: number | null,
  minPrice: number | null,
  maxPrice: number | null
): PriceTier | null {
  if (minPrice !== null && maxPrice !== null) {
    const avg = (minPrice + maxPrice) / 2;
    if (avg <= 100) return "BUDGET";
    if (avg <= 300) return "MODERATE";
    return "PREMIUM";
  }
  if (priceLevel === 1) return "BUDGET";
  if (priceLevel === 2) return "MODERATE";
  if (priceLevel !== null && priceLevel >= 3) return "PREMIUM";
  return null;
}

function parseOpeningHours(raw: unknown): RestaurantOpeningHours {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      isOpenNow: typeof obj.isOpenNow === "boolean" ? obj.isOpenNow : null,
      todayHours: typeof obj.todayHours === "string" ? obj.todayHours : null,
      weekdayText: Array.isArray(obj.weekdayText)
        ? obj.weekdayText.filter((v): v is string => typeof v === "string")
        : [],
    };
  }
  return { isOpenNow: null, todayHours: null, weekdayText: [] };
}

async function resolveMenuContext(
  menuId?: string,
  menuSlug?: string
): Promise<ResolvedMenuContext | null> {
  if (!menuId && !menuSlug) return null;

  // Try PostgreSQL first
  try {
    const found = await prisma.menu.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(menuId ? [{ id: menuId }] : []),
          ...(menuSlug ? [{ slug: menuSlug }] : []),
        ],
      },
      include: {
        category: { select: { slug: true } },
      },
    });

    if (found) {
      return {
        id: found.id,
        slug: found.slug,
        nameTh: found.nameTh,
        nameEn: found.nameEn,
        categorySlug: found.category.slug,
        searchKeywords: found.searchKeywords,
      };
    }
  } catch {
    // Database might be unavailable in local mock/test environment
  }

  // Fallback to seed catalog metadata (for mock-catalog menu IDs like "menu-pad-krapow-moo-sub")
  const normalizedSlug =
    menuSlug ?? (menuId?.startsWith("menu-") ? menuId.slice(5) : undefined);

  if (normalizedSlug) {
    const seed = SEED_MENUS.find((m) => m.slug === normalizedSlug);
    if (seed) {
      return {
        id: menuId ?? `menu-${seed.slug}`,
        slug: seed.slug,
        nameTh: seed.nameTh,
        nameEn: seed.nameEn,
        categorySlug: seed.categorySlug,
        searchKeywords: seed.searchKeywords,
      };
    }
  }

  return null;
}

async function queryPostgisNearbyRestaurants(
  query: NearbyRestaurantsQuery,
  resolvedMenu: ResolvedMenuContext | null
): Promise<{ restaurants: RestaurantDTO[]; postgisUsed: boolean }> {
  const radiusMeters = query.radiusKm * 1000;
  const fetchLimit = Math.min(query.limit * 2, 100);

  try {
    const rows = await prisma.$queryRaw<PostgisRestaurantRow[]>`
      SELECT
        r.id,
        r.google_place_id,
        r.name,
        r.address,
        r.province,
        r.district,
        r.latitude,
        r.longitude,
        r.phone,
        r.price_level,
        r.estimated_min_price,
        r.estimated_max_price,
        r.google_rating,
        r.google_review_count,
        r.app_rating_avg,
        r.app_review_count,
        r.opening_hours,
        r.photo_urls,
        r.data_source,
        ST_Distance(
          COALESCE(
            r.location,
            ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography
          ),
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) AS distance_meters
      FROM restaurants r
      WHERE ST_DWithin(
        COALESCE(
          r.location,
          ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography
        ),
        ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
        ${radiusMeters}
      )
      ORDER BY distance_meters ASC
      LIMIT ${fetchLimit}
    `;

    if (rows.length === 0) {
      return { restaurants: [], postgisUsed: true };
    }

    // Load restaurant_menus mappings (both for requested menu and for category tags)
    const menuMatchByRestId = new Map<string, RestaurantDTO["menuMatch"]>();
    const categoriesByRestId = new Map<string, Set<string>>();

    const allMappings = await prisma.restaurantMenu.findMany({
      where: {
        restaurantId: { in: rows.map((r) => r.id) },
        isAvailable: true,
      },
      include: {
        menu: {
          select: {
            id: true,
            slug: true,
            nameTh: true,
            category: { select: { slug: true } },
          },
        },
      },
    });

    for (const m of allMappings) {
      let catSet = categoriesByRestId.get(m.restaurantId);
      if (!catSet) {
        catSet = new Set<string>();
        categoriesByRestId.set(m.restaurantId, catSet);
      }
      catSet.add(m.menu.category.slug);

      if (
        resolvedMenu &&
        (m.menuId === resolvedMenu.id || m.menu.slug === resolvedMenu.slug)
      ) {
        menuMatchByRestId.set(m.restaurantId, {
          menuId: m.menu.id,
          menuSlug: m.menu.slug,
          menuNameTh: m.menu.nameTh,
          verificationStatus: m.verificationStatus,
          evidenceSource: m.evidenceSource,
          matchedPrice: m.price,
        });
      }
    }

    const mapped: RestaurantDTO[] = rows.map((row) => ({
      id: row.id,
      googlePlaceId: row.google_place_id,
      name: row.name,
      address: row.address,
      province: row.province,
      district: row.district,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: Number((Number(row.distance_meters) / 1000).toFixed(2)),
      phone: row.phone,
      priceLevel: row.price_level,
      priceTier: derivePriceTier(
        row.price_level,
        row.estimated_min_price,
        row.estimated_max_price
      ),
      estimatedMinPrice: row.estimated_min_price,
      estimatedMaxPrice: row.estimated_max_price,
      googleRating: row.google_rating,
      googleReviewCount: row.google_review_count,
      appRatingAvg: row.app_rating_avg,
      appReviewCount: row.app_review_count,
      openingHours: parseOpeningHours(row.opening_hours),
      photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
      categories: Array.from(categoriesByRestId.get(row.id) ?? []),
      dataSource: row.data_source,
      isMockData: row.data_source === "MOCK",
      menuMatch: menuMatchByRestId.get(row.id) ?? null,
    }));

    return { restaurants: mapped, postgisUsed: true };
  } catch {
    // PostgreSQL/PostGIS unavailable
    return { restaurants: [], postgisUsed: false };
  }
}

function getEffectiveRating(r: RestaurantDTO): number {
  return r.googleRating ?? r.appRatingAvg ?? 0;
}

function getSortPriceAsc(r: RestaurantDTO): number {
  if (r.estimatedMinPrice !== null) return r.estimatedMinPrice;
  if (r.priceLevel !== null) return r.priceLevel * 120;
  return Number.MAX_SAFE_INTEGER;
}

function getSortPriceDesc(r: RestaurantDTO): number {
  if (r.estimatedMaxPrice !== null) return r.estimatedMaxPrice;
  if (r.priceLevel !== null) return r.priceLevel * 120;
  return 0;
}

function applyFiltersAndSort(
  restaurants: RestaurantDTO[],
  query: NearbyRestaurantsQuery,
  resolvedMenu: ResolvedMenuContext | null
): RestaurantDTO[] {
  const enriched = restaurants.map((r) => {
    const menuMatch = evaluateMenuMatch(r, resolvedMenu);
    const withMatch: RestaurantDTO = { ...r, menuMatch };
    const rankingBreakdown = computeRestaurantRankScore(withMatch, {
      radiusKm: query.radiusKm,
      hasMenuQuery: Boolean(resolvedMenu),
    });
    return {
      ...withMatch,
      matchScore: rankingBreakdown.totalScore,
      rankingBreakdown,
    };
  });

  const filtered = enriched.filter((r) => {
    if (r.distanceKm > query.radiusKm) return false;

    if (query.minRating !== undefined) {
      if (getEffectiveRating(r) < query.minRating) return false;
    }

    if (query.priceTier && query.priceTier !== "ANY") {
      if (r.priceTier !== query.priceTier) return false;
    }

    if (query.priceLevel !== undefined) {
      if (r.priceLevel !== query.priceLevel) return false;
    }

    if (query.openNow === true) {
      if (r.openingHours.isOpenNow !== true) return false;
    }

    if (query.category) {
      if (r.categories.length > 0 && !r.categories.includes(query.category)) {
        return false;
      }
    }

    if (resolvedMenu && query.verificationFilter === "VERIFIED_ONLY") {
      if (r.menuMatch?.verificationStatus !== "VERIFIED") return false;
    } else if (resolvedMenu && query.verificationFilter === "MATCHED_ONLY") {
      if (!r.menuMatch) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sortBy) {
      case "distance":
        return a.distanceKm - b.distanceKm;
      case "rating": {
        const diff = getEffectiveRating(b) - getEffectiveRating(a);
        if (diff !== 0) return diff;
        return (
          b.googleReviewCount +
          b.appReviewCount -
          (a.googleReviewCount + a.appReviewCount)
        );
      }
      case "price_asc":
        return getSortPriceAsc(a) - getSortPriceAsc(b);
      case "price_desc":
        return getSortPriceDesc(b) - getSortPriceDesc(a);
      case "recommended":
      default: {
        const diff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
        if (diff !== 0) return diff;
        return a.distanceKm - b.distanceKm;
      }
    }
  });

  return sorted.slice(0, query.limit);
}

/**
 * Finds nearby restaurants using PostGIS spatial queries (when PostgreSQL is reachable)
 * combined with Google Places Adapter (live API or clearly-labeled mock fixtures).
 */
export async function findNearbyRestaurants(
  query: NearbyRestaurantsQuery
): Promise<NearbyRestaurantsResult> {
  const env = getServerEnv();
  const resolvedMenu = await resolveMenuContext(query.menuId, query.menuSlug);

  // 1. Try PostGIS ST_DWithin / ST_Distance query first
  const postgisResult = await queryPostgisNearbyRestaurants(query, resolvedMenu);

  // 2. Query Places Adapter:
  //    - In "live" mode: always query Google Places API (New) to supplement PostGIS.
  //    - In "mock" mode: use real PostGIS DB restaurants first; only fall back to MOCK_RESTAURANTS
  //      when PostGIS is offline or has 0 restaurants in this area.
  const shouldQueryAdapter =
    env.effectiveExternalMode === "live" || postgisResult.restaurants.length === 0;

  let adapterResult: {
    restaurants: RestaurantDTO[];
    mode: typeof env.effectiveExternalMode;
    cacheHit: boolean;
  };

  if (shouldQueryAdapter) {
    try {
      adapterResult = await searchPlacesNearby({
        latitude: query.lat,
        longitude: query.lng,
        radiusKm: query.radiusKm,
        menu: resolvedMenu,
        limit: query.limit,
      });
    } catch (error) {
      // If Google Places hits daily quota (429) or transient error, gracefully serve
      // real PostgreSQL + PostGIS restaurants if available (never substitutes mock data)
      if (postgisResult.restaurants.length > 0) {
        console.warn(
          "[RestaurantService] External Places API failed; serving real PostGIS records:",
          error instanceof Error ? error.message : error
        );
        adapterResult = {
          restaurants: [],
          mode: env.effectiveExternalMode,
          cacheHit: false,
        };
      } else {
        throw error;
      }
    }
  } else {
    adapterResult = {
      restaurants: [],
      mode: env.effectiveExternalMode,
      cacheHit: false,
    };
  }

  // 3. Merge deduplicating by googlePlaceId or id
  const seenKeys = new Set<string>();
  const merged: RestaurantDTO[] = [];

  for (const r of postgisResult.restaurants) {
    const key = r.googlePlaceId ? `gp:${r.googlePlaceId}` : `id:${r.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      merged.push(r);
    }
  }

  for (const r of adapterResult.restaurants) {
    const key = r.googlePlaceId ? `gp:${r.googlePlaceId}` : `id:${r.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      merged.push(r);
    }
  }

  // 4. Filter, score, and sort
  const finalRestaurants = applyFiltersAndSort(merged, query, resolvedMenu);

  // 5. Determine transparent data origin
  let dataOrigin: RestaurantDataOrigin;
  if (adapterResult.mode === "live" && adapterResult.restaurants.length > 0) {
    dataOrigin =
      postgisResult.restaurants.length > 0
        ? "postgis+google-places"
        : "google-places-live";
  } else if (postgisResult.restaurants.length > 0) {
    dataOrigin = "postgis";
  } else {
    dataOrigin = adapterResult.mode === "live" ? "google-places-live" : "mock-dataset";
  }

  return {
    restaurants: finalRestaurants,
    total: finalRestaurants.length,
    resolvedMenu,
    mode: env.effectiveExternalMode,
    dataOrigin,
    cacheHit: adapterResult.cacheHit,
    postgisUsed: postgisResult.postgisUsed,
    center: {
      latitude: query.lat,
      longitude: query.lng,
      radiusKm: query.radiusKm,
    },
  };
}
