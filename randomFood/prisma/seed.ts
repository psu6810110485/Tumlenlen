import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_CATEGORIES = [
  { slug: "thai", nameTh: "อาหารไทย", nameEn: "Thai", icon: "🌶️", sortOrder: 1 },
  { slug: "japanese", nameTh: "อาหารญี่ปุ่น", nameEn: "Japanese", icon: "🍣", sortOrder: 2 },
  { slug: "korean", nameTh: "อาหารเกาหลี", nameEn: "Korean", icon: "🍲", sortOrder: 3 },
  { slug: "chinese", nameTh: "อาหารจีน", nameEn: "Chinese", icon: "🥟", sortOrder: 4 },
  { slug: "italian", nameTh: "อาหารอิตาเลียน", nameEn: "Italian", icon: "🍝", sortOrder: 5 },
  { slug: "fast-food", nameTh: "ฟาสต์ฟู้ด", nameEn: "Fast Food", icon: "🍔", sortOrder: 6 },
];

async function main() {
  console.log("Seeding Phase 1 base categories...");

  for (const category of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
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
  }

  console.log(`Seeded ${INITIAL_CATEGORIES.length} categories successfully.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
