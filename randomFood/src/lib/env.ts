import { z } from "zod";

const externalApiModeSchema = z.enum(["mock", "live"]).default("mock");

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  EXTERNAL_API_MODE: externalApiModeSchema,
  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  AUTH_JWT_SECRET: z.string().optional().default(""),
  AUTH_COOKIE_NAME: z.string().default("fr_session"),
  GMAIL_USER: z.string().optional().default(""),
  GMAIL_APP_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM_NAME: z.string().optional().default("Food Roulette"),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  PLACES_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
});

export type ExternalApiMode = z.infer<typeof externalApiModeSchema>;

/**
 * Server-only validated environment config.
 * Never import this module into Client Components.
 */
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment configuration");
  }

  const data = parsed.data;
  const hasGooglePlacesKey = data.GOOGLE_PLACES_API_KEY.trim().length > 0;
  const hasGmailSmtpConfig =
    data.GMAIL_USER.trim().length > 0 &&
    data.GMAIL_APP_PASSWORD.trim().length > 0;

  // Never pretend to run in live mode if Google Places API key is missing
  const effectiveExternalMode: ExternalApiMode =
    data.EXTERNAL_API_MODE === "live" && hasGooglePlacesKey ? "live" : "mock";

  return {
    ...data,
    hasGooglePlacesKey,
    hasGmailSmtpConfig,
    effectiveExternalMode,
  };
}

/**
 * Client-safe public config (reads only NEXT_PUBLIC_* env vars).
 */
export function getPublicConfig() {
  const rawMode = process.env.NEXT_PUBLIC_EXTERNAL_API_MODE;
  const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
  const externalApiMode: ExternalApiMode = rawMode === "live" ? "live" : "mock";

  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Food Roulette",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    externalApiMode,
    hasGoogleMapsKey: hasMapsKey,
  };
}
