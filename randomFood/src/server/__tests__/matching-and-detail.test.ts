import { beforeEach, describe, expect, it } from "vitest";
import { placesCache } from "@/server/cache/memory-cache";
import {
  computeRestaurantRankScore,
  evaluateMenuMatch,
} from "@/server/services/matching-engine";
import {
  buildDeliveryLinks,
  getRestaurantDetail,
} from "@/server/services/restaurant-detail-service";
import { findNearbyRestaurants } from "@/server/services/restaurant-service";
import type { ResolvedMenuContext, RestaurantDTO } from "@/server/types/restaurant";

const SAMPLE_MENU: ResolvedMenuContext = {
  id: "menu-pad-krapow-moo-sub",
  slug: "pad-krapow-moo-sub",
  nameTh: "ข้าวกะเพราหมูสับไข่ดาว",
  nameEn: "Pad Krapow Moo Sub",
  categorySlug: "thai",
  searchKeywords: ["กะเพรา", "อาหารตามสั่ง", "pad krapow"],
};

function makeRestaurant(overrides: Partial<RestaurantDTO> = {}): RestaurantDTO {
  return {
    id: "rest-1",
    googlePlaceId: null,
    name: "ร้านตัวอย่าง",
    address: "ปทุมวัน กรุงเทพมหานคร",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.745,
    longitude: 100.534,
    distanceKm: 1.0,
    phone: null,
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 60,
    estimatedMaxPrice: 90,
    googleRating: 4.5,
    googleReviewCount: 200,
    appRatingAvg: null,
    appReviewCount: 0,
    openingHours: { isOpenNow: true, todayHours: "10:00 – 21:00", weekdayText: [] },
    photoUrls: [],
    categories: ["thai"],
    dataSource: "MOCK",
    isMockData: true,
    menuMatch: null,
    ...overrides,
  };
}

describe("Phase 4: Menu-Restaurant Matching & Ranking Engine", () => {
  it("preserves VERIFIED menu evidence when already present", () => {
    const rest = makeRestaurant({
      menuMatch: {
        menuId: SAMPLE_MENU.id,
        menuSlug: SAMPLE_MENU.slug,
        menuNameTh: SAMPLE_MENU.nameTh,
        verificationStatus: "VERIFIED",
        evidenceSource: "Verified DB Menu",
        matchedPrice: 75,
      },
    });

    const match = evaluateMenuMatch(rest, SAMPLE_MENU);
    expect(match?.verificationStatus).toBe("VERIFIED");
    expect(match?.matchedPrice).toBe(75);
  });

  it("infers INFERRED only when restaurant name contains explicit menu keyword", () => {
    const keywordMatchRest = makeRestaurant({ name: "ครัวกะเพราสูตรโบราณ" });
    const match = evaluateMenuMatch(keywordMatchRest, SAMPLE_MENU);
    expect(match?.verificationStatus).toBe("INFERRED");
    expect(match?.evidenceSource).toContain("กะเพรา");

    const unrelatedRest = makeRestaurant({ name: "ร้านสเต็กเฮาส์" });
    expect(evaluateMenuMatch(unrelatedRest, SAMPLE_MENU)).toBeNull();
  });

  it("ranks VERIFIED higher than INFERRED and unmatched restaurants", () => {
    const verifiedRest = makeRestaurant({
      menuMatch: {
        menuId: SAMPLE_MENU.id,
        menuSlug: SAMPLE_MENU.slug,
        menuNameTh: SAMPLE_MENU.nameTh,
        verificationStatus: "VERIFIED",
        evidenceSource: "Verified Catalog",
        matchedPrice: 75,
      },
    });
    const inferredRest = makeRestaurant({
      menuMatch: {
        menuId: SAMPLE_MENU.id,
        menuSlug: SAMPLE_MENU.slug,
        menuNameTh: SAMPLE_MENU.nameTh,
        verificationStatus: "INFERRED",
        evidenceSource: "Keyword Match",
        matchedPrice: null,
      },
    });
    const unmatchedRest = makeRestaurant({ menuMatch: null });

    const sVerified = computeRestaurantRankScore(verifiedRest, {
      radiusKm: 5,
      hasMenuQuery: true,
    });
    const sInferred = computeRestaurantRankScore(inferredRest, {
      radiusKm: 5,
      hasMenuQuery: true,
    });
    const sUnmatched = computeRestaurantRankScore(unmatchedRest, {
      radiusKm: 5,
      hasMenuQuery: true,
    });

    expect(sVerified.verificationScore).toBe(45);
    expect(sInferred.verificationScore).toBe(20);
    expect(sUnmatched.verificationScore).toBe(0);
    expect(sVerified.totalScore).toBeGreaterThan(sInferred.totalScore);
    expect(sInferred.totalScore).toBeGreaterThan(sUnmatched.totalScore);
  });

  it("supports verificationFilter (VERIFIED_ONLY and MATCHED_ONLY) in findNearbyRestaurants", async () => {
    placesCache.clear();
    process.env.EXTERNAL_API_MODE = "mock";

    const verifiedOnly = await findNearbyRestaurants({
      lat: 13.7447,
      lng: 100.5335,
      radiusKm: 5,
      menuSlug: "pad-krapow-moo-sub",
      priceTier: "ANY",
      verificationFilter: "VERIFIED_ONLY",
      sortBy: "recommended",
      limit: 20,
    });

    expect(verifiedOnly.restaurants.length).toBeGreaterThan(0);
    for (const r of verifiedOnly.restaurants) {
      expect(r.menuMatch?.verificationStatus).toBe("VERIFIED");
      expect(typeof r.matchScore).toBe("number");
    }
  });
});

describe("Phase 4: Restaurant Detail Service & Delivery Links", () => {
  beforeEach(() => {
    process.env.EXTERNAL_API_MODE = "mock";
  });

  it("returns full restaurant detail with separated Google vs App reviews and VERIFIED/INFERRED menus", async () => {
    const detail = await getRestaurantDetail("mock-rest-bkk-01", {
      userLat: 13.7447,
      userLng: 100.5335,
      highlightMenuSlug: "pad-krapow-moo-sub",
    });

    expect(detail).not.toBeNull();
    expect(detail?.isMockData).toBe(true);
    expect(detail?.distanceKm).not.toBeNull();
    expect(detail?.matchedMenus.some((m) => m.verificationStatus === "VERIFIED")).toBe(true);
    expect(detail?.matchedMenus.some((m) => m.verificationStatus === "INFERRED")).toBe(true);
    expect(detail?.menuMatch?.verificationStatus).toBe("VERIFIED");
    // Must not fabricate fake web user reviews
    expect(detail?.appReviews).toEqual([]);
  });

  it("returns null for non-existent restaurant ID", async () => {
    const missing = await getRestaurantDetail("non-existent-id-999");
    expect(missing).toBeNull();
  });

  it("uses transparent Search Fallback URLs when no verified delivery URLs exist", () => {
    const fallbackLinks = buildDeliveryLinks("ครัวกะเพรา (Mock)", null, null);
    expect(fallbackLinks).toHaveLength(2);
    expect(fallbackLinks.every((l) => l.isVerifiedDirectUrl === false)).toBe(true);
    expect(fallbackLinks[0].url).toContain("food.grab.com");
    expect(fallbackLinks[0].url).not.toContain("(Mock)");

    const verifiedLinks = buildDeliveryLinks(
      "ครัวกะเพรา",
      "https://food.grab.com/th/th/restaurant/verified-id",
      null
    );
    expect(verifiedLinks[0].isVerifiedDirectUrl).toBe(true);
    expect(verifiedLinks[1].isVerifiedDirectUrl).toBe(false);
  });
});
