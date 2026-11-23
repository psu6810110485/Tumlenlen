import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SEED_MENUS } from "../src/server/data/menu-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories and Phase 2 menu catalog...");

  const categoryIdBySlug = new Map<string, string>();

  for (const category of SEED_CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameTh: category.nameTh,
        nameEn: category.nameEn,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: category,
    });
    categoryIdBySlug.set(record.slug, record.id);
  }

  let menuCount = 0;
  for (const menu of SEED_MENUS) {
    const categoryId = categoryIdBySlug.get(menu.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug: ${menu.categorySlug}`);
    }

    await prisma.menu.upsert({
      where: { slug: menu.slug },
      update: {
        categoryId,
        nameTh: menu.nameTh,
        nameEn: menu.nameEn,
        descriptionTh: menu.descriptionTh,
        imageUrl: menu.imageUrl,
        minPrice: menu.minPrice,
        maxPrice: menu.maxPrice,
        priceTier: menu.priceTier,
        mealTypes: menu.mealTypes,
        searchKeywords: menu.searchKeywords,
        isActive: true,
      },
      create: {
        categoryId,
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
        isActive: true,
      },
    });
    menuCount += 1;
  }

  console.log(
    `Seeded ${SEED_CATEGORIES.length} categories and ${menuCount} menus successfully.`
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
