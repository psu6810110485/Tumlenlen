import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { randomizeMenu } from "@/server/services/menu-service";
import { randomMenuRequestSchema } from "@/server/validators/menu";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body: unknown = {};
    const rawText = await request.text();
    if (rawText.trim().length > 0) {
      try {
        body = JSON.parse(rawText);
      } catch {
        return apiError("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
          status: 400,
        });
      }
    }

    const parsed = randomMenuRequestSchema.parse(body);
    const result = await randomizeMenu(parsed);

    return apiSuccess(
      {
        menu: result.menu,
        totalMatching: result.totalMatching,
        remainingCandidates: result.remainingCandidates,
        exhausted: result.exhausted,
        candidatesPreview: result.candidatesPreview,
      },
      {
        meta: {
          source: result.source,
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
