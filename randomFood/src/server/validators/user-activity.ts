import { z } from "zod";

export const upsertReviewSchema = z.object({
  restaurantId: z.string().trim().min(1, "กรุณาระบุรหัสร้านอาหาร").max(160),
  restaurantName: z.string().trim().max(200).optional(),
  rating: z.coerce
    .number()
    .int("คะแนนต้องเป็นจำนวนเต็ม 1 ถึง 5")
    .min(1, "คะแนนต่ำสุดคือ 1 ดาว")
    .max(5, "คะแนนสูงสุดคือ 5 ดาว"),
  comment: z
    .string()
    .trim()
    .min(5, "กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร")
    .max(1000, "รีวิวต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const toggleFavoriteSchema = z.object({
  restaurantId: z.string().trim().min(1, "กรุณาระบุรหัสร้านอาหาร").max(160),
  restaurantName: z.string().trim().max(200).optional(),
  restaurantAddress: z.string().trim().max(500).optional(),
  restaurantPhotoUrl: z.string().trim().max(1000).nullable().optional(),
});

export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
