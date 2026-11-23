import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { enforceRateLimit } from "@/server/security/rate-limiter";
import {
  completePasswordReset,
  verifyResetToken,
} from "@/server/services/password-reset-service";
import { resetPasswordRequestSchema } from "@/server/validators/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() ?? "";
    const result = await verifyResetToken(token);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    scope: "auth-reset-password",
    maxRequests: 10,
  });
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
        status: 400,
      });
    }

    const parsed = resetPasswordRequestSchema.parse(body);
    const result = await completePasswordReset(parsed.token, parsed.newPassword);

    if (!result.success) {
      return apiError(
        "VALIDATION_ERROR",
        "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง",
        { status: 400 }
      );
    }

    return apiSuccess({
      reset: true,
      message: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
