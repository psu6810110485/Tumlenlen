import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getCurrentSession } from "@/server/auth/session";
import { listUserRandomHistory } from "@/server/services/history-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบเพื่อดูประวัติการสุ่มอาหาร", {
        status: 401,
      });
    }

    const history = await listUserRandomHistory(session.userId, 20);
    return apiSuccess({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
