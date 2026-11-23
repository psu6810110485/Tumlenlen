import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.photos",
  "places.nationalPhoneNumber",
].join(",");

interface GooglePlaceItem {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  nationalPhoneNumber?: string;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  photos?: Array<{ name?: string }>;
}

function mapPriceLevel(raw?: string): number | null {
  switch (raw) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return null;
  }
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "ไม่พบ GOOGLE_PLACES_API_KEY ในไฟล์ .env — กรุณาใส่ API Key ก่อนรัน npm run db:sync-places"
    );
    process.exit(1);
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });

  console.log(
    `กำลังซิงก์รูปหน้าร้านและคะแนนรีวิวจริงจาก Google Places API (New) สำหรับ ${restaurants.length} ร้าน...`
  );

  let updatedCount = 0;
  let skippedCount = 0;

  for (const rest of restaurants) {
    const query = [rest.name, rest.district, rest.province]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await fetch(SEARCH_TEXT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "th",
          regionCode: "TH",
          maxResultCount: 1,
          locationBias: {
            circle: {
              center: {
                latitude: rest.latitude,
                longitude: rest.longitude,
              },
              radius: 1500,
            },
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[SKIP] ${rest.name} — Google API status ${res.status}`);
        skippedCount += 1;
        continue;
      }

      const data = (await res.json()) as { places?: GooglePlaceItem[] };
      const place = data.places?.[0];
      if (!place?.id) {
        console.warn(`[SKIP] ${rest.name} — ไม่พบข้อมูลใน Google Places`);
        skippedCount += 1;
        continue;
      }

      const photoUrls = (place.photos ?? [])
        .slice(0, 4)
        .map((p) => p.name)
        .filter((name): name is string => Boolean(name))
        .map(
          (name) =>
            `/api/v1/places/photo?name=${encodeURIComponent(name)}&maxWidthPx=800`
        );

      const hoursSource = place.currentOpeningHours ?? place.regularOpeningHours;
      const weekdayText = hoursSource?.weekdayDescriptions ?? [];

      await prisma.restaurant.update({
        where: { id: rest.id },
        data: {
          googlePlaceId: place.id,
          googleRating: typeof place.rating === "number" ? place.rating : null,
          googleReviewCount: place.userRatingCount ?? 0,
          photoUrls,
          phone: place.nationalPhoneNumber ?? rest.phone,
          priceLevel: mapPriceLevel(place.priceLevel) ?? rest.priceLevel,
          ...(weekdayText.length > 0
            ? {
                openingHours: {
                  isOpenNow: hoursSource?.openNow ?? null,
                  todayHours: weekdayText[0] ?? null,
                  weekdayText,
                },
              }
            : {}),
          dataSource: "GOOGLE_PLACES",
          lastSyncedAt: new Date(),
        },
      });

      console.log(
        `[OK] ${rest.name} -> rating=${place.rating ?? "-"} (${place.userRatingCount ?? 0} reviews), photos=${photoUrls.length}`
      );
      updatedCount += 1;
    } catch (err) {
      console.warn(
        `[ERR] ${rest.name}:`,
        err instanceof Error ? err.message : err
      );
      skippedCount += 1;
    }
  }

  console.log(
    `ซิงก์เสร็จสิ้น: อัปเดตสำเร็จ ${updatedCount} ร้าน, ข้าม ${skippedCount} ร้าน`
  );
}

main()
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
