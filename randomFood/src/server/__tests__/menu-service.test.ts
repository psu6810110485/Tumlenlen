import { beforeEach, describe, expect, it } from "vitest";
import {
  listCategories,
  listMenus,
  randomizeMenu,
} from "@/server/services/menu-service";
import { randomMenuRequestSchema } from "@/server/validators/menu";

describe("Phase 2 Menu & Randomizer Service", () => {
  beforeEach(() => {
    process.env.EXTERNAL_API_MODE = "mock";
  });
  it("lists all 6 base categories with menu counts", async () => {
    const { categories } = await listCategories();
    expect(categories.length).toBeGreaterThanOrEqual(6);
    expect(categories.every((c) => c.menuCount > 0)).toBe(true);
  });

  it("filters menus by category and priceTier", async () => {
    const { menus } = await listMenus({
      category: "thai",
      priceTier: "BUDGET",
    });
    expect(menus.length).toBeGreaterThan(0);
    for (const menu of menus) {
      expect(menu.category.slug).toBe("thai");
      expect(menu.priceTier).toBe("BUDGET");
    }
  });

  it("randomizes a menu matching category and mealType filters", async () => {
    const result = await randomizeMenu({
      categories: ["japanese"],
      priceTier: "ANY",
      mealType: "DINNER",
      excludeMenuIds: [],
    });

    expect(result.menu).not.toBeNull();
    expect(result.menu?.category.slug).toBe("japanese");
    expect(result.menu?.mealTypes).toContain("DINNER");
    expect(result.exhausted).toBe(false);
  });

  it("prevents repeats via excludeMenuIds and reports exhausted when all are excluded", async () => {
    const { menus } = await listMenus({ category: "italian" });
    expect(menus.length).toBeGreaterThan(1);

    const allIds = menus.map((m) => m.id);
    const excludeAllButOne = allIds.slice(0, -1);

    const lastPick = await randomizeMenu({
      categories: ["italian"],
      priceTier: "ANY",
      mealType: "ANY",
      excludeMenuIds: excludeAllButOne,
    });

    expect(lastPick.menu?.id).toBe(allIds[allIds.length - 1]);
    expect(lastPick.remainingCandidates).toBe(0);
    expect(lastPick.exhausted).toBe(false);

    const exhaustedPick = await randomizeMenu({
      categories: ["italian"],
      priceTier: "ANY",
      mealType: "ANY",
      excludeMenuIds: allIds,
    });

    expect(exhaustedPick.menu).toBeNull();
    expect(exhaustedPick.exhausted).toBe(true);
    expect(exhaustedPick.totalMatching).toBe(allIds.length);
  });

  it("validates random menu request input with Zod", () => {
    const bad = randomMenuRequestSchema.safeParse({
      priceTier: "INVALID_TIER",
      latitude: 200,
    });
    expect(bad.success).toBe(false);
  });
});
