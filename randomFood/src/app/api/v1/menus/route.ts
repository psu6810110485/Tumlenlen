import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/server/api-response";
import { listMenus } from "@/server/services/menu-service";
import { listMenusQuerySchema } from "@/server/validators/menu";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rawQuery = {
      category: sp.get("category") ?? undefined,
      priceTier: sp.get("priceTier") ?? undefined,
      mealType: sp.get("mealType") ?? undefined,
      maxBudget: sp.get("maxBudget") ?? undefined,
      search: sp.get("search") ?? undefined,
    };

    const parsed = listMenusQuerySchema.parse(rawQuery);
    const { menus, source } = await listMenus(parsed);

    return apiSuccess(
      { menus, total: menus.length },
      { meta: { source } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
