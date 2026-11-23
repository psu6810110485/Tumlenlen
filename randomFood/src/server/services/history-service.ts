import { randomUUID } from "crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { mockUserStore } from "@/server/services/mock-user-store";

export interface RandomHistoryDTO {
  id: string;
  menuId: string;
  menuSlug: string;
  menuNameTh: string;
  categorySlug: string;
  minPrice: number;
  maxPrice: number;
  createdAt: string;
}

function allowMockFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

export function recordMockRandomHistory(entry: {
  userId: string | null;
  sessionToken: string | null;
  menuId: string;
  menuSlug: string;
  menuNameTh: string;
  categorySlug: string;
  minPrice: number;
  maxPrice: number;
}): void {
  mockUserStore.history.unshift({
    id: randomUUID(),
    ...entry,
    createdAt: new Date().toISOString(),
  });
  if (mockUserStore.history.length > 200) {
    mockUserStore.history.length = 200;
  }
}

export async function listUserRandomHistory(
  userId: string,
  limit = 20
): Promise<RandomHistoryDTO[]> {
  try {
    const rows = await prisma.randomHistory.findMany({
      where: { userId },
      include: {
        menu: {
          include: { category: { select: { slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (rows.length > 0 || !allowMockFallback()) {
      return rows.map((row) => ({
        id: row.id,
        menuId: row.menu.id,
        menuSlug: row.menu.slug,
        menuNameTh: row.menu.nameTh,
        categorySlug: row.menu.category.slug,
        minPrice: row.menu.minPrice,
        maxPrice: row.menu.maxPrice,
        createdAt: row.createdAt.toISOString(),
      }));
    }
  } catch (error) {
    if (!allowMockFallback()) throw error;
  }

  return mockUserStore.history
    .filter((h) => h.userId === userId)
    .slice(0, limit)
    .map((h) => ({
      id: h.id,
      menuId: h.menuId,
      menuSlug: h.menuSlug,
      menuNameTh: h.menuNameTh,
      categorySlug: h.categorySlug,
      minPrice: h.minPrice,
      maxPrice: h.maxPrice,
      createdAt: h.createdAt,
    }));
}
