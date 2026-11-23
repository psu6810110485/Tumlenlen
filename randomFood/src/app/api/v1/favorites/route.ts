import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getCurrentSession } from "@/server/auth/session";
import {
  listUserFavorites,
  toggleFavorite,
} from "@/server/services/favorite-service";
import { toggleFavoriteSchema } from "@/server/validators/user-activity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบเพื่อดูร้านโปรด", {
        status: 401,
      });
    }

    const favorites = await listUserFavorites(session.userId);
    return apiSuccess({ favorites });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนบันทึกร้านโปรด", {
        status: 401,
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
        status: 400,
      });
    }

    const parsed = toggleFavoriteSchema.parse(body);
    const result = await toggleFavorite(session.userId, parsed);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
