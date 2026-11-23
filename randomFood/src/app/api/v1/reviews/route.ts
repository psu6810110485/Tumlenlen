import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getCurrentSession } from "@/server/auth/session";
import { enforceRateLimit } from "@/server/security/rate-limiter";
import {
  listRestaurantReviews,
  listUserReviews,
  upsertUserReview,
} from "@/server/services/review-service";
import { upsertReviewSchema } from "@/server/validators/user-activity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId")?.trim();
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const session = await getCurrentSession();
      if (!session) {
        return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบเพื่อดูรีวิวของคุณ", {
          status: 401,
        });
      }
      const reviews = await listUserReviews(session.userId);
      return apiSuccess({ reviews });
    }

    if (!restaurantId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ restaurantId", {
        status: 400,
      });
    }

    const result = await listRestaurantReviews(restaurantId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    scope: "reviews-write",
    maxRequests: 20,
  });
  if (limited) return limited;

  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว", {
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

    const parsed = upsertReviewSchema.parse(body);
    const review = await upsertUserReview(
      session.userId,
      session.displayName,
      parsed
    );

    const summary = await listRestaurantReviews(parsed.restaurantId);
    return apiSuccess(
      {
        review,
        appRatingAvg: summary.appRatingAvg,
        appReviewCount: summary.appReviewCount,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
