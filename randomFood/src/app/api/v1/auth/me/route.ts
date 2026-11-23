import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { clearSessionCookie, getCurrentSession } from "@/server/auth/session";
import {
  deleteUserAccount,
  getUserProfile,
} from "@/server/services/auth-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiSuccess({ user: null });
    }

    const { user, storage } = await getUserProfile(session.userId);
    if (!user) {
      const response = apiSuccess({ user: null });
      clearSessionCookie(response);
      return response;
    }

    return apiSuccess({ user }, { meta: { storage } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PDPA Right to Erasure: permanently deletes the authenticated user's account.
 */
export async function DELETE() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนดำเนินการ", {
        status: 401,
      });
    }

    await deleteUserAccount(session.userId);
    const response = apiSuccess({ deleted: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
