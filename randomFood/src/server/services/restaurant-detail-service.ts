import type { PriceTier } from "@prisma/client";
import { getServerEnv } from "@/lib/env";
import { calculateDistanceKm } from "@/lib/geo";
import { prisma } from "@/server/db";
import { SEED_MENUS } from "@/server/data/menu-catalog";
import { MOCK_RESTAURANTS } from "@/server/data/mock-restaurants";
import { getMockReviewsForRestaurant } from "@/server/services/review-service";
import type {
  RestaurantDeliveryLinkDTO,
  RestaurantDetailDTO,
  RestaurantOpeningHours,
} from "@/server/types/restaurant";

/**
 * Builds delivery links strictly obeying Rule 4:
 * - Uses verified direct URLs ONLY when stored on the restaurant record.
 * - Otherwise returns transparent Search Fallback links (never fake store URLs).
 */
export function buildDeliveryLinks(
  restaurantName: string,
  verifiedGrabUrl?: string | null,
  verifiedLineManUrl?: string | null
): RestaurantDeliveryLinkDTO[] {
  const cleanName = restaurantName.replace(/\s*\(Mock\)\s*/gi, "").trim();

  return [
    verifiedGrabUrl
      ? {
          provider: "GRABFOOD",
          label: "สั่งผ่าน GrabFood",
          url: verifiedGrabUrl,
          isVerifiedDirectUrl: true,
        }
      : {
          provider: "GRABFOOD",
          label: "ค้นหาร้านบน GrabFood",
          url: `https://food.grab.com/th/th/restaurants?search=${encodeURIComponent(cleanName)}`,
          isVerifiedDirectUrl: false,
        },
    verifiedLineManUrl
      ? {
          provider: "LINEMAN",
          label: "สั่งผ่าน LINE MAN",
          url: verifiedLineManUrl,
          isVerifiedDirectUrl: true,
        }
      : {
          provider: "LINEMAN",
          label: "ค้นหาร้านบน LINE MAN",
          url: `https://www.wongnai.com/restaurants?q=${encodeURIComponent(cleanName)}`,
          isVerifiedDirectUrl: false,
        },
  ];
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

export interface GetRestaurantDetailOptions {
  userLat?: number;
  userLng?: number;
  highlightMenuSlug?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads full Restaurant Detail from PostgreSQL (when available) or clearly-labeled
 * Mock Dataset (in mock mode). Never silently returns mock data in live mode.
 */
export async function getRestaurantDetail(
  id: string,
  options: GetRestaurantDetailOptions = {}
): Promise<RestaurantDetailDTO | null> {
  const env = getServerEnv();

  // 1. Try PostgreSQL first if ID is UUID or googlePlaceId
  const googlePlaceId = id.startsWith("gplace-") ? id.slice(7) : null;
  if (UUID_REGEX.test(id) || googlePlaceId) {
    try {
      const row = await prisma.restaurant.findFirst({
        where: UUID_REGEX.test(id)
          ? { id }
          : { googlePlaceId: googlePlaceId! },
        include: {
          restaurantMenus: {
            where: { isAvailable: true },
            include: {
              menu: {
                include: { category: { select: { slug: true } } },
              },
            },
            orderBy: { verificationStatus: "asc" }, // VERIFIED before INFERRED
          },
          reviews: {
            where: { isFlagged: false },
            include: {
              user: { select: { displayName: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (row) {
        const distanceKm =
          options.userLat !== undefined && options.userLng !== undefined
            ? calculateDistanceKm(
                options.userLat,
                options.userLng,
                row.latitude,
                row.longitude
              )
            : null;

        const matchedMenus = row.restaurantMenus.map((rm) => ({
          menuId: rm.menu.id,
          menuSlug: rm.menu.slug,
          menuNameTh: rm.menu.nameTh,
          menuNameEn: rm.menu.nameEn,
          categorySlug: rm.menu.category.slug,
          verificationStatus: rm.verificationStatus,
          evidenceSource: rm.evidenceSource,
          price: rm.price,
        }));

        const highlighted = options.highlightMenuSlug
          ? matchedMenus.find((m) => m.menuSlug === options.highlightMenuSlug) ??
            null
          : null;

        return {
          id: row.id,
          googlePlaceId: row.googlePlaceId,
          name: row.name,
          address: row.address,
          province: row.province,
          district: row.district,
          latitude: row.latitude,
          longitude: row.longitude,
          distanceKm,
          phone: row.phone,
          priceLevel: row.priceLevel,
          priceTier: derivePriceTier(
            row.priceLevel,
            row.estimatedMinPrice,
            row.estimatedMaxPrice
          ),
          estimatedMinPrice: row.estimatedMinPrice,
          estimatedMaxPrice: row.estimatedMaxPrice,
          googleRating: row.googleRating,
          googleReviewCount: row.googleReviewCount,
          appRatingAvg: row.appRatingAvg,
          appReviewCount: row.appReviewCount,
          openingHours: parseOpeningHours(row.openingHours),
          photoUrls: row.photoUrls,
          categories: Array.from(new Set(matchedMenus.map((m) => m.categorySlug))),
          dataSource: row.dataSource,
          isMockData: row.dataSource === "MOCK",
          menuMatch: highlighted
            ? {
                menuId: highlighted.menuId,
                menuSlug: highlighted.menuSlug,
                menuNameTh: highlighted.menuNameTh,
                verificationStatus: highlighted.verificationStatus,
                evidenceSource: highlighted.evidenceSource,
                matchedPrice: highlighted.price,
              }
            : null,
          matchedMenus,
          appReviews: row.reviews.map((rev) => ({
            id: rev.id,
            authorName: rev.user.displayName,
            rating: rev.rating,
            comment: rev.comment,
            createdAt: rev.createdAt.toISOString(),
          })),
          deliveryLinks: buildDeliveryLinks(
            row.name,
            row.grabFoodUrl,
            row.lineManUrl
          ),
        };
      }
    } catch {
      // DB unavailable; only fall back to mock dataset if in mock mode
    }
  }

  // 2. Mock Dataset lookup ONLY in mock mode
  if (env.effectiveExternalMode === "mock") {
    const mock = MOCK_RESTAURANTS.find((r) => r.id === id);
    if (!mock) return null;

    const distanceKm =
      options.userLat !== undefined && options.userLng !== undefined
        ? calculateDistanceKm(
            options.userLat,
            options.userLng,
            mock.latitude,
            mock.longitude
          )
        : null;

    const matchedMenus = mock.menuEvidence
      .map((ev) => {
        const seed = SEED_MENUS.find((m) => m.slug === ev.menuSlug);
        if (!seed) return null;
        return {
          menuId: `menu-${seed.slug}`,
          menuSlug: seed.slug,
          menuNameTh: seed.nameTh,
          menuNameEn: seed.nameEn,
          categorySlug: seed.categorySlug,
          verificationStatus: ev.verificationStatus,
          evidenceSource: ev.evidenceSource,
          price: ev.price,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) =>
        a.verificationStatus === b.verificationStatus
          ? 0
          : a.verificationStatus === "VERIFIED"
            ? -1
            : 1
      );

    const highlighted = options.highlightMenuSlug
      ? matchedMenus.find((m) => m.menuSlug === options.highlightMenuSlug) ??
        null
      : null;

    const mockWebReviews = getMockReviewsForRestaurant(mock.id);

    return {
      id: mock.id,
      googlePlaceId: null,
      name: mock.name,
      address: mock.address,
      province: mock.province,
      district: mock.district,
      latitude: mock.latitude,
      longitude: mock.longitude,
      distanceKm,
      phone: mock.phone,
      priceLevel: mock.priceLevel,
      priceTier: mock.priceTier,
      estimatedMinPrice: mock.estimatedMinPrice,
      estimatedMaxPrice: mock.estimatedMaxPrice,
      googleRating: mock.googleRating,
      googleReviewCount: mock.googleReviewCount,
      appRatingAvg: mockWebReviews.appRatingAvg ?? mock.appRatingAvg,
      appReviewCount:
        mockWebReviews.appReviewCount > 0
          ? mockWebReviews.appReviewCount
          : mock.appReviewCount,
      openingHours: mock.openingHours,
      photoUrls: mock.photoUrls,
      categories: mock.categories,
      dataSource: "MOCK",
      isMockData: true,
      menuMatch: highlighted
        ? {
            menuId: highlighted.menuId,
            menuSlug: highlighted.menuSlug,
            menuNameTh: highlighted.menuNameTh,
            verificationStatus: highlighted.verificationStatus,
            evidenceSource: highlighted.evidenceSource,
            matchedPrice: highlighted.price,
          }
        : null,
      matchedMenus,
      // Strictly keep web reviews separate and never fabricate fake user reviews
      appReviews: mockWebReviews.reviews.map((rev) => ({
        id: rev.id,
        authorName: rev.authorName,
        rating: rev.rating,
        comment: rev.comment,
        createdAt: rev.createdAt,
      })),
      deliveryLinks: buildDeliveryLinks(mock.name, null, null),
    };
  }

  return null;
}
