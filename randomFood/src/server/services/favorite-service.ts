import { randomUUID } from "crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { MOCK_RESTAURANTS } from "@/server/data/mock-restaurants";
import { mockUserStore } from "@/server/services/mock-user-store";
import type { ToggleFavoriteInput } from "@/server/validators/user-activity";

export interface FavoriteDTO {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhotoUrl: string | null;
  createdAt: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function allowMockFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

export async function listUserFavorites(userId: string): Promise<FavoriteDTO[]> {
  if (UUID_REGEX.test(userId)) {
    try {
      const rows = await prisma.favorite.findMany({
        where: { userId },
        include: {
          restaurant: {
            select: { name: true, address: true, photoUrls: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      if (rows.length > 0 || !allowMockFallback()) {
        return rows.map((row) => ({
          id: row.id,
          restaurantId: row.restaurantId,
          restaurantName: row.restaurant.name,
          restaurantAddress: row.restaurant.address,
          restaurantPhotoUrl: row.restaurant.photoUrls[0] ?? null,
          createdAt: row.createdAt.toISOString(),
        }));
      }
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  return Array.from(mockUserStore.favorites.values())
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((f) => ({
      id: f.id,
      restaurantId: f.restaurantId,
      restaurantName: f.restaurantName,
      restaurantAddress: f.restaurantAddress,
      restaurantPhotoUrl: f.restaurantPhotoUrl,
      createdAt: f.createdAt,
    }));
}

export async function isRestaurantFavorited(
  userId: string,
  restaurantId: string
): Promise<boolean> {
  const favorites = await listUserFavorites(userId);
  return favorites.some((f) => f.restaurantId === restaurantId);
}

export async function toggleFavorite(
  userId: string,
  input: ToggleFavoriteInput
): Promise<{ isFavorited: boolean; favorite: FavoriteDTO | null }> {
  if (UUID_REGEX.test(userId) && UUID_REGEX.test(input.restaurantId)) {
    try {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId: input.restaurantId,
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
        return { isFavorited: false, favorite: null };
      }

      const created = await prisma.favorite.create({
        data: {
          userId,
          restaurantId: input.restaurantId,
        },
        include: {
          restaurant: {
            select: { name: true, address: true, photoUrls: true },
          },
        },
      });

      return {
        isFavorited: true,
        favorite: {
          id: created.id,
          restaurantId: created.restaurantId,
          restaurantName: created.restaurant.name,
          restaurantAddress: created.restaurant.address,
          restaurantPhotoUrl: created.restaurant.photoUrls[0] ?? null,
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (!allowMockFallback()) throw error;
    }
  }

  // Mock/local memory fallback
  for (const [id, fav] of mockUserStore.favorites.entries()) {
    if (fav.userId === userId && fav.restaurantId === input.restaurantId) {
      mockUserStore.favorites.delete(id);
      return { isFavorited: false, favorite: null };
    }
  }

  const mockRest = MOCK_RESTAURANTS.find((r) => r.id === input.restaurantId);
  const id = randomUUID();
  const created = {
    id,
    userId,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName || mockRest?.name || "ร้านอาหาร",
    restaurantAddress:
      input.restaurantAddress || mockRest?.address || "ไม่ระบุที่อยู่",
    restaurantPhotoUrl:
      input.restaurantPhotoUrl ?? mockRest?.photoUrls[0] ?? null,
    createdAt: new Date().toISOString(),
  };
  mockUserStore.favorites.set(id, created);

  return {
    isFavorited: true,
    favorite: {
      id: created.id,
      restaurantId: created.restaurantId,
      restaurantName: created.restaurantName,
      restaurantAddress: created.restaurantAddress,
      restaurantPhotoUrl: created.restaurantPhotoUrl,
      createdAt: created.createdAt,
    },
  };
}
