import { z } from "zod";

export const registerRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("กรุณากรอกอีเมลให้ถูกต้อง")
    .max(255),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(128, "รหัสผ่านต้องไม่เกิน 128 ตัวอักษร"),
  displayName: z
    .string()
    .trim()
    .min(2, "ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(80, "ชื่อที่แสดงต้องไม่เกิน 80 ตัวอักษร"),
  pdpaAccepted: z.literal(true, {
    errorMap: () => ({
      message: "กรุณายอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนสมัครสมาชิก",
    }),
  }),
});

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("กรุณากรอกอีเมลให้ถูกต้อง").max(255),
});

export const resetPasswordRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, "โทเคนรีเซ็ตรหัสผ่านไม่ถูกต้อง")
    .max(256, "โทเคนรีเซ็ตรหัสผ่านไม่ถูกต้อง"),
  newPassword: z
    .string()
    .min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(128, "รหัสผ่านใหม่ต้องไม่เกิน 128 ตัวอักษร"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
