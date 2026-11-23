import { z } from "zod";

export const priceTierFilterSchema = z
  .enum(["ANY", "BUDGET", "MODERATE", "PREMIUM"])
  .default("ANY");

export const mealTypeFilterSchema = z
  .enum(["ANY", "BREAKFAST", "LUNCH", "DINNER", "LATE_NIGHT", "SNACK"])
  .default("ANY");

export const listMenusQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  priceTier: priceTierFilterSchema.optional(),
  mealType: mealTypeFilterSchema.optional(),
  maxBudget: z.coerce.number().int().positive().max(10000).optional(),
  search: z.string().trim().max(100).optional(),
});

export const randomMenuRequestSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  priceTier: priceTierFilterSchema,
  mealType: mealTypeFilterSchema,
  maxBudget: z.number().int().positive().max(10000).optional(),
  excludeMenuIds: z.array(z.string().trim().min(1).max(120)).max(200).optional().default([]),
  sessionToken: z.string().trim().min(1).max(128).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type ListMenusQuery = z.infer<typeof listMenusQuerySchema>;
export type RandomMenuRequest = z.infer<typeof randomMenuRequestSchema>;
