import { z } from "zod";

const booleanQuerySchema = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((val) => val === true || val === "true" || val === "1")
  .optional();

export const restaurantSortBySchema = z
  .enum(["recommended", "distance", "rating", "price_asc", "price_desc"])
  .default("recommended");

export const restaurantPriceTierSchema = z
  .enum(["ANY", "BUDGET", "MODERATE", "PREMIUM"])
  .default("ANY");

export const verificationFilterSchema = z
  .enum(["ALL", "VERIFIED_ONLY", "MATCHED_ONLY"])
  .default("ALL");

export const nearbyRestaurantsQuerySchema = z.object({
  lat: z.coerce.number().min(-90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90").max(90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90"),
  lng: z.coerce.number().min(-180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180").max(180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180"),
  radiusKm: z.coerce.number().min(0.5).max(50).default(5),
  menuId: z.string().trim().min(1).max(120).optional(),
  menuSlug: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  priceTier: restaurantPriceTierSchema.optional().default("ANY"),
  priceLevel: z.coerce.number().int().min(1).max(4).optional(),
  openNow: booleanQuerySchema,
  verificationFilter: verificationFilterSchema.optional(),
  sortBy: restaurantSortBySchema.optional().default("recommended"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NearbyRestaurantsQuery = z.infer<typeof nearbyRestaurantsQuerySchema>;
export type RestaurantSortBy = z.infer<typeof restaurantSortBySchema>;
export type VerificationFilter = z.infer<typeof verificationFilterSchema>;
