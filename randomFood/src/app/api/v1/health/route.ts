import { getServerEnv } from "@/lib/env";
import { apiSuccess } from "@/server/api-response";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getServerEnv();

  let databaseStatus: "connected" | "disconnected" = "disconnected";
  let postgisVersion: string | null = null;
  let databaseError: string | null = null;

  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT PostGIS_Version() AS version
    `;
    databaseStatus = "connected";
    postgisVersion = result[0]?.version ?? null;
  } catch (error) {
    databaseStatus = "disconnected";
    databaseError =
      error instanceof Error ? error.message.split("\n")[0] : "Unable to connect to PostgreSQL";
  }

  return apiSuccess(
    {
      service: "food-roulette-api",
      phase: 1,
      status: databaseStatus === "connected" ? "healthy" : "degraded",
      database: {
        status: databaseStatus,
        postgisVersion,
        ...(databaseError ? { note: databaseError } : {}),
      },
      externalApis: {
        configuredMode: env.EXTERNAL_API_MODE,
        effectiveMode: env.effectiveExternalMode,
        googlePlacesConfigured: env.hasGooglePlacesKey,
      },
    },
    {
      status: 200,
      meta: {
        mode: env.effectiveExternalMode,
      },
    }
  );
}
