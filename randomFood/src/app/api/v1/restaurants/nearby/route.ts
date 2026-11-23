import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { ExternalPlacesApiError } from "@/server/adapters/google-places-adapter";
import { findNearbyRestaurants } from "@/server/services/restaurant-service";
import { nearbyRestaurantsQuerySchema } from "@/server/validators/restaurant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const parsed = nearbyRestaurantsQuerySchema.parse(rawQuery);

    const result = await findNearbyRestaurants(parsed);

    return apiSuccess(
      {
        restaurants: result.restaurants,
        total: result.total,
        resolvedMenu: result.resolvedMenu,
        center: result.center,
      },
      {
        meta: {
          mode: result.mode,
          dataOrigin: result.dataOrigin,
          cacheHit: result.cacheHit,
          postgisUsed: result.postgisUsed,
        },
      }
    );
  } catch (error) {
    if (error instanceof ExternalPlacesApiError) {
      return apiError("EXTERNAL_API_ERROR", error.message, {
        status: error.statusCode,
      });
    }
    return handleApiError(error);
  }
}
