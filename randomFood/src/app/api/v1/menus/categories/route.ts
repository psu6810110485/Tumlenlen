import { apiSuccess, handleApiError } from "@/server/api-response";
import { listCategories } from "@/server/services/menu-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { categories, source } = await listCategories();
    return apiSuccess(
      { categories, total: categories.length },
      { meta: { source } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
