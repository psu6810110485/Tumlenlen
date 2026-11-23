import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SEED_MENUS } from "../src/server/data/menu-catalog";
import { REAL_RESTAURANTS_SEED } from "../src/server/data/real-restaurants-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories, menus, and real PostGIS restaurants...");

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

  const menuIdBySlug = new Map<string, string>();
  for (const menu of SEED_MENUS) {
    const categoryId = categoryIdBySlug.get(menu.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug: ${menu.categorySlug}`);
    }

    const record = await prisma.menu.upsert({
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
    menuIdBySlug.set(record.slug, record.id);
  }

  let restaurantCount = 0;
  let mappingCount = 0;

  for (const rest of REAL_RESTAURANTS_SEED) {
    // Idempotently match existing curated restaurant by name + province
    const existing = await prisma.restaurant.findFirst({
      where: {
        name: rest.name,
        province: rest.province,
        dataSource: "INTERNAL",
      },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.restaurant.update({
          where: { id: existing.id },
          data: {
            address: rest.address,
            district: rest.district,
            latitude: rest.latitude,
            longitude: rest.longitude,
            phone: rest.phone,
            priceLevel: rest.priceLevel,
            estimatedMinPrice: rest.estimatedMinPrice,
            estimatedMaxPrice: rest.estimatedMaxPrice,
            openingHours: rest.openingHours,
            photoUrls: rest.photoUrls,
            lastSyncedAt: new Date(),
          },
        })
      : await prisma.restaurant.create({
          data: {
            name: rest.name,
            address: rest.address,
            province: rest.province,
            district: rest.district,
            latitude: rest.latitude,
            longitude: rest.longitude,
            phone: rest.phone,
            priceLevel: rest.priceLevel,
            estimatedMinPrice: rest.estimatedMinPrice,
            estimatedMaxPrice: rest.estimatedMaxPrice,
            openingHours: rest.openingHours,
            photoUrls: rest.photoUrls,
            dataSource: "INTERNAL",
            lastSyncedAt: new Date(),
          },
        });

    // Populate PostGIS geography(Point, 4326) column so GiST Spatial Index is actively used
    await prisma.$executeRaw`
      UPDATE restaurants
      SET location = ST_SetSRID(ST_MakePoint(${rest.longitude}, ${rest.latitude}), 4326)::geography
      WHERE id = ${saved.id}::uuid
    `;
    restaurantCount += 1;

    for (const m of rest.menus) {
      const menuId = menuIdBySlug.get(m.menuSlug);
      if (!menuId) continue;

      await prisma.restaurantMenu.upsert({
        where: {
          restaurantId_menuId: {
            restaurantId: saved.id,
            menuId,
          },
        },
        update: {
          price: m.price,
          verificationStatus: m.verificationStatus,
          evidenceSource: m.evidenceSource,
          verifiedAt: m.verificationStatus === "VERIFIED" ? new Date() : null,
          isAvailable: true,
        },
        create: {
          restaurantId: saved.id,
          menuId,
          price: m.price,
          verificationStatus: m.verificationStatus,
          evidenceSource: m.evidenceSource,
          verifiedAt: m.verificationStatus === "VERIFIED" ? new Date() : null,
          isAvailable: true,
        },
      });
      mappingCount += 1;
    }
  }

  console.log(
    `Seeded ${SEED_CATEGORIES.length} categories, ${menuIdBySlug.size} menus, ${restaurantCount} real PostGIS restaurants, and ${mappingCount} menu mappings.`
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
