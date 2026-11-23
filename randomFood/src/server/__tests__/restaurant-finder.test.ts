import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleMapsDirectionsUrl,
  calculateDistanceKm,
  formatDistanceTh,
} from "@/lib/geo";
import { MemoryTtlCache, placesCache } from "@/server/cache/memory-cache";
import {
  ExternalPlacesApiError,
  searchPlacesNearby,
} from "@/server/adapters/google-places-adapter";
import { findNearbyRestaurants } from "@/server/services/restaurant-service";
import { nearbyRestaurantsQuerySchema } from "@/server/validators/restaurant";

describe("Phase 3: Geo & Cache Utilities", () => {
  it("calculates Haversine distance accurately between Pathum Wan and Watthana", () => {
    const dist = calculateDistanceKm(13.7447, 100.5335, 13.7393, 100.5784);
    expect(dist).toBeGreaterThan(4.5);
    expect(dist).toBeLessThan(5.5);
  });

  it("formats distances in meters (< 1km) and kilometers (>= 1km)", () => {
    expect(formatDistanceTh(0.45)).toBe("450 ม.");
    expect(formatDistanceTh(2.34)).toBe("2.3 กม.");
  });

  it("builds official Google Maps directions URL", () => {
    const url = buildGoogleMapsDirectionsUrl(13.7456, 100.5349, "ครัวกะเพรา");
    expect(url).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(url).toContain("13.7456");
  });

  it("stores, expires, and evicts entries in MemoryTtlCache", async () => {
    const cache = new MemoryTtlCache<string>(2);
    cache.set("k1", "v1", 5000);
    cache.set("k2", "v2", 5000);
    expect(cache.get("k1")).toBe("v1");

    // Exceed maxEntries = 2 -> oldest ("k1") evicted
    cache.set("k3", "v3", 5000);
    expect(cache.get("k1")).toBeNull();
    expect(cache.get("k2")).toBe("v2");
    expect(cache.get("k3")).toBe("v3");

    // TTL expiration
    cache.set("short", "temp", 10);
    await new Promise((r) => setTimeout(r, 25));
    expect(cache.get("short")).toBeNull();
  });
});

describe("Phase 3: Restaurant Nearby API Validation (Zod)", () => {
  it("parses valid query parameters and applies defaults", () => {
    const parsed = nearbyRestaurantsQuerySchema.safeParse({
      lat: "13.7447",
      lng: "100.5335",
      openNow: "true",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.radiusKm).toBe(5);
      expect(parsed.data.sortBy).toBe("recommended");
      expect(parsed.data.priceTier).toBe("ANY");
      expect(parsed.data.openNow).toBe(true);
      expect(parsed.data.limit).toBe(20);
    }
  });

  it("rejects out-of-range coordinates, invalid radius, and invalid sortBy", () => {
    expect(
      nearbyRestaurantsQuerySchema.safeParse({ lat: 95, lng: 100 }).success
    ).toBe(false);
    expect(
      nearbyRestaurantsQuerySchema.safeParse({ lat: 13.7, lng: 200 }).success
    ).toBe(false);
    expect(
      nearbyRestaurantsQuerySchema.safeParse({
        lat: 13.7,
        lng: 100.5,
        radiusKm: 100,
      }).success
    ).toBe(false);
    expect(
      nearbyRestaurantsQuerySchema.safeParse({
        lat: 13.7,
        lng: 100.5,
        sortBy: "invalid_sort",
      }).success
    ).toBe(false);
  });
});

describe("Phase 3: Google Places Adapter (Mock vs Live Mode)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    placesCache.clear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns clearly-labeled MOCK restaurants and uses short-term cache in mock mode", async () => {
    process.env.EXTERNAL_API_MODE = "mock";
    process.env.GOOGLE_PLACES_API_KEY = "";

    const first = await searchPlacesNearby({
      latitude: 13.7447,
      longitude: 100.5335,
      radiusKm: 5,
    });

    expect(first.mode).toBe("mock");
    expect(first.cacheHit).toBe(false);
    expect(first.restaurants.length).toBeGreaterThan(0);
    expect(
      first.restaurants.every((r) => r.isMockData && r.dataSource === "MOCK")
    ).toBe(true);

    const second = await searchPlacesNearby({
      latitude: 13.7447,
      longitude: 100.5335,
      radiusKm: 5,
    });

    expect(second.cacheHit).toBe(true);
    expect(second.restaurants.length).toBe(first.restaurants.length);
  });

  it("calls Google Places API (New) with FieldMask and proxies photos without leaking API key in live mode", async () => {
    process.env.EXTERNAL_API_MODE = "live";
    process.env.GOOGLE_PLACES_API_KEY = "SUPER_SECRET_SERVER_KEY";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          places: [
            {
              id: "ChIJTest123",
              displayName: { text: "ร้านข้าวกะเพราจริง" },
              formattedAddress: "ปทุมวัน กรุงเทพมหานคร",
              location: { latitude: 13.745, longitude: 100.534 },
              rating: 4.6,
              userRatingCount: 120,
              priceLevel: "PRICE_LEVEL_INEXPENSIVE",
              currentOpeningHours: {
                openNow: true,
                weekdayDescriptions: ["Monday: 09:00 – 20:00"],
              },
              photos: [{ name: "places/ChIJTest123/photos/photo_abc" }],
              types: ["thai_restaurant", "restaurant"],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await searchPlacesNearby({
      latitude: 13.7447,
      longitude: 100.5335,
      radiusKm: 5,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("SUPER_SECRET_SERVER_KEY");
    expect(headers["X-Goog-FieldMask"]).toContain("places.displayName");

    expect(res.mode).toBe("live");
    expect(res.restaurants).toHaveLength(1);
    expect(res.restaurants[0].isMockData).toBe(false);
    expect(res.restaurants[0].dataSource).toBe("GOOGLE_PLACES");
    // Photo URL must be proxied and NEVER contain the raw API key
    expect(res.restaurants[0].photoUrls[0]).toContain("/api/v1/places/photo?name=");
    expect(res.restaurants[0].photoUrls[0]).not.toContain("SUPER_SECRET_SERVER_KEY");
  });

  it("throws ExternalPlacesApiError on upstream failure in live mode (never silently substitutes mock data)", async () => {
    process.env.EXTERNAL_API_MODE = "live";
    process.env.GOOGLE_PLACES_API_KEY = "SUPER_SECRET_SERVER_KEY";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Quota exceeded", { status: 429 })
    );

    await expect(
      searchPlacesNearby({
        latitude: 13.7447,
        longitude: 100.5335,
        radiusKm: 5,
      })
    ).rejects.toBeInstanceOf(ExternalPlacesApiError);
  });
});

describe("Phase 3: Restaurant Finder Service", () => {
  beforeEach(() => {
    placesCache.clear();
    process.env.EXTERNAL_API_MODE = "mock";
  });

  it("filters by radius, minRating, priceTier, and openNow", async () => {
    const result = await findNearbyRestaurants({
      lat: 13.7447,
      lng: 100.5335,
      radiusKm: 5,
      minRating: 4.5,
      priceTier: "MODERATE",
      openNow: true,
      sortBy: "distance",
      limit: 20,
    });

    expect(result.restaurants.length).toBeGreaterThan(0);
    for (const r of result.restaurants) {
      expect(r.distanceKm).toBeLessThanOrEqual(5);
      expect(r.googleRating ?? r.appRatingAvg ?? 0).toBeGreaterThanOrEqual(4.5);
      expect(r.priceTier).toBe("MODERATE");
      expect(r.openingHours.isOpenNow).toBe(true);
    }

    // Verify ascending distance order
    for (let i = 1; i < result.restaurants.length; i++) {
      expect(result.restaurants[i].distanceKm).toBeGreaterThanOrEqual(
        result.restaurants[i - 1].distanceKm
      );
    }
  });

  it("sorts by rating descending and price_asc ascending", async () => {
    const byRating = await findNearbyRestaurants({
      lat: 13.7447,
      lng: 100.5335,
      radiusKm: 10,
      priceTier: "ANY",
      sortBy: "rating",
      limit: 20,
    });

    for (let i = 1; i < byRating.restaurants.length; i++) {
      const prev = byRating.restaurants[i - 1].googleRating ?? 0;
      const curr = byRating.restaurants[i].googleRating ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }

    const byPriceAsc = await findNearbyRestaurants({
      lat: 13.7447,
      lng: 100.5335,
      radiusKm: 10,
      priceTier: "ANY",
      sortBy: "price_asc",
      limit: 20,
    });

    for (let i = 1; i < byPriceAsc.restaurants.length; i++) {
      const prev = byPriceAsc.restaurants[i - 1].estimatedMinPrice ?? 9999;
      const curr = byPriceAsc.restaurants[i].estimatedMinPrice ?? 9999;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("strictly separates VERIFIED vs INFERRED menu matches and never fabricates matches without evidence", async () => {
    const result = await findNearbyRestaurants({
      lat: 13.7447,
      lng: 100.5335,
      radiusKm: 5,
      menuSlug: "pad-krapow-moo-sub",
      priceTier: "ANY",
      sortBy: "recommended",
      limit: 20,
    });

    expect(result.resolvedMenu?.slug).toBe("pad-krapow-moo-sub");
    expect(result.restaurants.length).toBeGreaterThan(1);

    // Top recommended restaurant should have VERIFIED evidence for pad-krapow-moo-sub
    expect(result.restaurants[0].menuMatch?.verificationStatus).toBe("VERIFIED");

    // Restaurants without evidence for this menu must have menuMatch === null
    const withoutEvidence = result.restaurants.filter((r) => r.menuMatch === null);
    expect(withoutEvidence.length).toBeGreaterThan(0);

    // Google rating and App rating must remain distinct fields
    for (const r of result.restaurants) {
      expect("googleRating" in r && "googleReviewCount" in r).toBe(true);
      expect("appRatingAvg" in r && "appReviewCount" in r).toBe(true);
    }
  });
});
