import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getCurrentSession } from "@/server/auth/session";
import { deleteUserReview } from "@/server/services/review-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนลบรีวิว", {
        status: 401,
      });
    }

    const { id } = await context.params;
    const deleted = await deleteUserReview(session.userId, id);
    if (!deleted) {
      return apiError("NOT_FOUND", "ไม่พบรีวิวที่ต้องการลบ หรือคุณไม่มีสิทธิ์ลบรีวิวนี้", {
        status: 404,
      });
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
