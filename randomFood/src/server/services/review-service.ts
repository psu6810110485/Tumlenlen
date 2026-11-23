import { randomUUID } from "crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { MOCK_RESTAURANTS } from "@/server/data/mock-restaurants";
import { mockUserStore } from "@/server/services/mock-user-store";
import type { UpsertReviewInput } from "@/server/validators/user-activity";

export interface WebReviewDTO {
  id: string;
  userId: string;
  authorName: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function allowMockFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

function resolveRestaurantName(restaurantId: string, provided?: string): string {
  if (provided && provided.trim().length > 0) return provided.trim();
  const mock = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);
  return mock?.name ?? "ร้านอาหาร";
}

export function getMockReviewsForRestaurant(restaurantId: string): {
  reviews: WebReviewDTO[];
  appRatingAvg: number | null;
  appReviewCount: number;
} {
  const reviews = Array.from(mockUserStore.reviews.values())
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (reviews.length === 0) {
    return { reviews: [], appRatingAvg: null, appReviewCount: 0 };
  }

  const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
  return {
    reviews,
    appRatingAvg: Number((sum / reviews.length).toFixed(2)),
    appReviewCount: reviews.length,
  };
}

/**
 * Lists Food Roulette user reviews for a restaurant (strictly separate from Google reviews).
 */
export async function listRestaurantReviews(restaurantId: string): Promise<{
  reviews: WebReviewDTO[];
  appRatingAvg: number | null;
  appReviewCount: number;
}> {
  if (UUID_REGEX.test(restaurantId)) {
    try {
      const rows = await prisma.review.findMany({
        where: { restaurantId, isFlagged: false },
        include: {
          user: { select: { displayName: true } },
          restaurant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const reviews: WebReviewDTO[] = rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        authorName: row.user.displayName,
        restaurantId: row.restaurantId,
        restaurantName: row.restaurant.name,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

      const count = reviews.length;
      const avg =
        count > 0
          ? Number(
              (reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(2)
            )
          : null;

      return { reviews, appRatingAvg: avg, appReviewCount: count };
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  return getMockReviewsForRestaurant(restaurantId);
}

/**
 * Creates or updates the authenticated user's review for a restaurant (1 review per user per restaurant).
 */
export async function upsertUserReview(
  userId: string,
  authorName: string,
  input: UpsertReviewInput
): Promise<WebReviewDTO> {
  if (UUID_REGEX.test(userId) && UUID_REGEX.test(input.restaurantId)) {
    try {
      const saved = await prisma.review.upsert({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId: input.restaurantId,
          },
        },
        update: {
          rating: input.rating,
          comment: input.comment.trim(),
        },
        create: {
          userId,
          restaurantId: input.restaurantId,
          rating: input.rating,
          comment: input.comment.trim(),
        },
        include: {
          user: { select: { displayName: true } },
          restaurant: { select: { name: true } },
        },
      });

      // Recalculate appRatingAvg & appReviewCount strictly for web reviews
      const agg = await prisma.review.aggregate({
        where: { restaurantId: input.restaurantId, isFlagged: false },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.restaurant.update({
        where: { id: input.restaurantId },
        data: {
          appRatingAvg: agg._avg.rating
            ? Number(agg._avg.rating.toFixed(2))
            : null,
          appReviewCount: agg._count.rating,
        },
      });

      return {
        id: saved.id,
        userId: saved.userId,
        authorName: saved.user.displayName,
        restaurantId: saved.restaurantId,
        restaurantName: saved.restaurant.name,
        rating: saved.rating,
        comment: saved.comment,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      };
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  // Mock/local memory fallback
  const now = new Date().toISOString();
  let existingId: string | null = null;
  for (const [id, rev] of mockUserStore.reviews.entries()) {
    if (rev.userId === userId && rev.restaurantId === input.restaurantId) {
      existingId = id;
      break;
    }
  }

  const id = existingId ?? randomUUID();
  const prev = existingId ? mockUserStore.reviews.get(existingId) : null;
  const record: WebReviewDTO = {
    id,
    userId,
    authorName,
    restaurantId: input.restaurantId,
    restaurantName: resolveRestaurantName(input.restaurantId, input.restaurantName),
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  mockUserStore.reviews.set(id, record);
  return record;
}

export async function deleteUserReview(
  userId: string,
  reviewId: string
): Promise<boolean> {
  if (UUID_REGEX.test(reviewId)) {
    try {
      const existing = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      if (existing && existing.userId === userId) {
        await prisma.review.delete({ where: { id: reviewId } });
        const agg = await prisma.review.aggregate({
          where: { restaurantId: existing.restaurantId, isFlagged: false },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await prisma.restaurant.update({
          where: { id: existing.restaurantId },
          data: {
            appRatingAvg: agg._avg.rating
              ? Number(agg._avg.rating.toFixed(2))
              : null,
            appReviewCount: agg._count.rating,
          },
        });
        return true;
      }
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  const mockRev = mockUserStore.reviews.get(reviewId);
  if (mockRev && mockRev.userId === userId) {
    mockUserStore.reviews.delete(reviewId);
    return true;
  }
  return false;
}

export async function listUserReviews(userId: string): Promise<WebReviewDTO[]> {
  if (UUID_REGEX.test(userId)) {
    try {
      const rows = await prisma.review.findMany({
        where: { userId },
        include: {
          user: { select: { displayName: true } },
          restaurant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (rows.length > 0 || !allowMockFallback()) {
        return rows.map((row) => ({
          id: row.id,
          userId: row.userId,
          authorName: row.user.displayName,
          restaurantId: row.restaurantId,
          restaurantName: row.restaurant.name,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      }
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  return Array.from(mockUserStore.reviews.values())
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
