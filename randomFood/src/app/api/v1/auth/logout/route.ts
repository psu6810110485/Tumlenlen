import { apiSuccess } from "@/server/api-response";
import { clearSessionCookie } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  clearSessionCookie(response);
  return response;
}
