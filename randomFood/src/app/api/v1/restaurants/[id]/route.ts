import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getRestaurantDetail } from "@/server/services/restaurant-detail-service";

export const dynamic = "force-dynamic";

const detailQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  menuSlug: z.string().trim().min(1).max(120).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || id.trim().length === 0 || id.length > 160) {
      return apiError("VALIDATION_ERROR", "รหัสร้านอาหารไม่ถูกต้อง", {
        status: 400,
      });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = detailQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const detail = await getRestaurantDetail(id.trim(), {
      userLat: parsedQuery.lat,
      userLng: parsedQuery.lng,
      highlightMenuSlug: parsedQuery.menuSlug,
    });

    if (!detail) {
      return apiError("NOT_FOUND", "ไม่พบข้อมูลร้านอาหารที่ต้องการ", {
        status: 404,
      });
    }

    return apiSuccess(detail, {
      meta: {
        mode: getServerEnv().effectiveExternalMode,
        isMockData: detail.isMockData,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
