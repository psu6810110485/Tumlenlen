import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { EmailDeliveryError } from "@/server/mail/gmail-mailer";
import { enforceRateLimit } from "@/server/security/rate-limiter";
import { requestPasswordReset } from "@/server/services/password-reset-service";
import { forgotPasswordRequestSchema } from "@/server/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    scope: "auth-forgot-password",
    maxRequests: 5,
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

    const parsed = forgotPasswordRequestSchema.parse(body);
    const requestOrigin = new URL(request.url).origin;
    const result = await requestPasswordReset(parsed.email, requestOrigin);

    return apiSuccess(
      {
        message:
          "หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้เรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม) ของคุณ",
        deliveryMode: result.deliveryMode,
        ...(result.previewResetUrl
          ? { previewResetUrl: result.previewResetUrl }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return apiError("EXTERNAL_API_ERROR", error.message, { status: 502 });
    }
    return handleApiError(error);
  }
}
