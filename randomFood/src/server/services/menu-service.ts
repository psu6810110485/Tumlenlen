import { randomInt } from "crypto";
import type { MealType, Prisma, PriceTier } from "@prisma/client";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { SEED_CATEGORIES, SEED_MENUS } from "@/server/data/menu-catalog";
import type { ListMenusQuery, RandomMenuRequest } from "@/server/validators/menu";

export type DataOrigin = "database" | "mock-catalog";

export interface CategoryDTO {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  menuCount: number;
}

export interface MenuDTO {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  priceTier: PriceTier;
  mealTypes: MealType[];
  searchKeywords: string[];
  category: {
    id: string;
    slug: string;
    nameTh: string;
    nameEn: string;
    icon: string;
  };
}

export interface RandomMenuResult {
  menu: MenuDTO | null;
  totalMatching: number;
  remainingCandidates: number;
  exhausted: boolean;
  source: DataOrigin;
  candidatesPreview: Array<{ id: string; nameTh: string; icon: string }>;
}

function getFallbackCategories(): CategoryDTO[] {
  return SEED_CATEGORIES.map((cat) => ({
    id: `cat-${cat.slug}`,
    ...cat,
    menuCount: SEED_MENUS.filter((m) => m.categorySlug === cat.slug).length,
  }));
}

function getFallbackMenus(): MenuDTO[] {
  const catMap = new Map(SEED_CATEGORIES.map((c) => [c.slug, c]));
  return SEED_MENUS.map((menu) => {
    const cat = catMap.get(menu.categorySlug)!;
    return {
      id: `menu-${menu.slug}`,
      slug: menu.slug,
      nameTh: menu.nameTh,
      nameEn: menu.nameEn,
      descriptionTh: menu.descriptionTh,
      imageUrl: menu.imageUrl,
      minPrice: menu.minPrice,
      maxPrice: menu.maxPrice,
      priceTier: menu.priceTier,
      mealTypes: menu.mealTypes,
      searchKeywords: menu.searchKeywords,
      category: {
        id: `cat-${cat.slug}`,
        slug: cat.slug,
        nameTh: cat.nameTh,
        nameEn: cat.nameEn,
        icon: cat.icon,
      },
    };
  });
}

function filterFallbackMenus(
  menus: MenuDTO[],
  filters: {
    categories?: string[];
    priceTier?: string;
    mealType?: string;
    maxBudget?: number;
    search?: string;
  }
) {
  return menus.filter((menu) => {
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(menu.category.slug)) return false;
    }
    if (filters.priceTier && filters.priceTier !== "ANY") {
      if (menu.priceTier !== filters.priceTier) return false;
    }
    if (filters.mealType && filters.mealType !== "ANY") {
      if (!menu.mealTypes.includes(filters.mealType as MealType)) return false;
    }
    if (filters.maxBudget !== undefined) {
      if (menu.minPrice > filters.maxBudget) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [
        menu.nameTh,
        menu.nameEn,
        menu.descriptionTh,
        ...menu.searchKeywords,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function allowCatalogFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

export async function listCategories(): Promise<{
  categories: CategoryDTO[];
  source: DataOrigin;
}> {
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { menus: { where: { isActive: true } } },
        },
      },
    });

    if (rows.length === 0 && allowCatalogFallback()) {
      return { categories: getFallbackCategories(), source: "mock-catalog" };
    }

    return {
      categories: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        nameTh: row.nameTh,
        nameEn: row.nameEn,
        icon: row.icon,
        sortOrder: row.sortOrder,
        menuCount: row._count.menus,
      })),
      source: "database",
    };
  } catch (error) {
    if (allowCatalogFallback()) {
      return { categories: getFallbackCategories(), source: "mock-catalog" };
    }
    throw error;
  }
}

export async function listMenus(query: ListMenusQuery): Promise<{
  menus: MenuDTO[];
  source: DataOrigin;
}> {
  const where: Prisma.MenuWhereInput = { isActive: true };

  if (query.category) {
    where.category = { slug: query.category };
  }
  if (query.priceTier && query.priceTier !== "ANY") {
    where.priceTier = query.priceTier;
  }
  if (query.mealType && query.mealType !== "ANY") {
    where.mealTypes = { has: query.mealType };
  }
  if (query.maxBudget !== undefined) {
    where.minPrice = { lte: query.maxBudget };
  }
  if (query.search) {
    where.OR = [
      { nameTh: { contains: query.search, mode: "insensitive" } },
      { nameEn: { contains: query.search, mode: "insensitive" } },
      { descriptionTh: { contains: query.search, mode: "insensitive" } },
    ];
  }

  try {
    const rows = await prisma.menu.findMany({
      where,
      include: {
        category: {
          select: { id: true, slug: true, nameTh: true, nameEn: true, icon: true },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { nameTh: "asc" }],
    });

    return {
      menus: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        nameTh: row.nameTh,
        nameEn: row.nameEn,
        descriptionTh: row.descriptionTh,
        imageUrl: row.imageUrl,
        minPrice: row.minPrice,
        maxPrice: row.maxPrice,
        priceTier: row.priceTier,
        mealTypes: row.mealTypes,
        searchKeywords: row.searchKeywords,
        category: row.category,
      })),
      source: "database",
    };
  } catch (error) {
    if (allowCatalogFallback()) {
      const filtered = filterFallbackMenus(getFallbackMenus(), {
        categories: query.category ? [query.category] : undefined,
        priceTier: query.priceTier,
        mealType: query.mealType,
        maxBudget: query.maxBudget,
        search: query.search,
      });
      return { menus: filtered, source: "mock-catalog" };
    }
    throw error;
  }
}

export async function randomizeMenu(
  input: RandomMenuRequest
): Promise<RandomMenuResult> {
  const excludeSet = new Set(input.excludeMenuIds);

  const pickFromPool = (
    allMatching: MenuDTO[],
    source: DataOrigin
  ): RandomMenuResult => {
    const candidates = allMatching.filter(
      (m) => !excludeSet.has(m.id) && !excludeSet.has(m.slug)
    );

    const candidatesPreview = allMatching.slice(0, 12).map((m) => ({
      id: m.id,
      nameTh: m.nameTh,
      icon: m.category.icon,
    }));

    if (allMatching.length === 0) {
      return {
        menu: null,
        totalMatching: 0,
        remainingCandidates: 0,
        exhausted: false,
        source,
        candidatesPreview: [],
      };
    }

    if (candidates.length === 0) {
      return {
        menu: null,
        totalMatching: allMatching.length,
        remainingCandidates: 0,
        exhausted: true,
        source,
        candidatesPreview,
      };
    }

    const pickedIndex = randomInt(0, candidates.length);
    const picked = candidates[pickedIndex];

    return {
      menu: picked,
      totalMatching: allMatching.length,
      remainingCandidates: candidates.length - 1,
      exhausted: false,
      source,
      candidatesPreview,
    };
  };

  try {
    const where: Prisma.MenuWhereInput = { isActive: true };
    if (input.categories.length > 0) {
      where.category = { slug: { in: input.categories } };
    }
    if (input.priceTier !== "ANY") {
      where.priceTier = input.priceTier;
    }
    if (input.mealType !== "ANY") {
      where.mealTypes = { has: input.mealType };
    }
    if (input.maxBudget !== undefined) {
      where.minPrice = { lte: input.maxBudget };
    }

    const rows = await prisma.menu.findMany({
      where,
      include: {
        category: {
          select: { id: true, slug: true, nameTh: true, nameEn: true, icon: true },
        },
      },
    });

    // If database is connected but empty (not seeded yet) in mock mode, use fallback catalog
    if (rows.length === 0 && allowCatalogFallback()) {
      const totalInDb = await prisma.menu.count();
      if (totalInDb === 0) {
        const fallback = filterFallbackMenus(getFallbackMenus(), {
          categories: input.categories,
          priceTier: input.priceTier,
          mealType: input.mealType,
          maxBudget: input.maxBudget,
        });
        return pickFromPool(fallback, "mock-catalog");
      }
    }

    const mapped: MenuDTO[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      nameTh: row.nameTh,
      nameEn: row.nameEn,
      descriptionTh: row.descriptionTh,
      imageUrl: row.imageUrl,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      priceTier: row.priceTier,
      mealTypes: row.mealTypes,
      searchKeywords: row.searchKeywords,
      category: row.category,
    }));

    const result = pickFromPool(mapped, "database");

    // Record random history in PostgreSQL when a menu was selected
    if (result.menu) {
      await prisma.randomHistory
        .create({
          data: {
            menuId: result.menu.id,
            sessionToken: input.sessionToken ?? null,
            filtersSnapshot: {
              categories: input.categories,
              priceTier: input.priceTier,
              mealType: input.mealType,
              maxBudget: input.maxBudget ?? null,
            },
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
          },
        })
        .catch((err) => {
          console.warn("[RandomHistory] Failed to save history:", err);
        });
    }

    return result;
  } catch (error) {
    if (allowCatalogFallback()) {
      const fallback = filterFallbackMenus(getFallbackMenus(), {
        categories: input.categories,
        priceTier: input.priceTier,
        mealType: input.mealType,
        maxBudget: input.maxBudget,
      });
      return pickFromPool(fallback, "mock-catalog");
    }
    throw error;
  }
}
