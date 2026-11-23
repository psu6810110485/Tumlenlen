import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { setSessionCookie } from "@/server/auth/session";
import { AuthServiceError, loginUser } from "@/server/services/auth-service";
import { loginRequestSchema } from "@/server/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
        status: 400,
      });
    }

    const parsed = loginRequestSchema.parse(body);
    const { user, storage } = await loginUser(parsed);

    const response = apiSuccess({ user }, { meta: { storage } });
    setSessionCookie(response, {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return apiError(error.code, error.message, { status: error.statusCode });
    }
    return handleApiError(error);
  }
}
