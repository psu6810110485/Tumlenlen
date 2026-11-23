import { describe, expect, it, afterEach } from "vitest";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/server/api-response";
import { getServerEnv } from "@/lib/env";

describe("API Response helpers", () => {
  it("formats success responses with standard envelope", async () => {
    const res = apiSuccess({ hello: "world" }, { status: 201, meta: { mode: "mock" } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ hello: "world" });
    expect(body.meta.mode).toBe("mock");
    expect(typeof body.meta.timestamp).toBe("string");
  });

  it("formats error responses with code and message", async () => {
    const res = apiError("NOT_FOUND", "ไม่พบข้อมูล", { status: 404 });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("ไม่พบข้อมูล");
  });

  it("converts ZodError into 400 VALIDATION_ERROR", async () => {
    const schema = z.object({ radiusKm: z.number().min(1) });
    const parsed = schema.safeParse({ radiusKm: 0 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const res = handleApiError(parsed.error);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details.radiusKm).toBeDefined();
    }
  });
});

describe("Environment configuration safety", () => {
  const originalMode = process.env.EXTERNAL_API_MODE;
  const originalKey = process.env.GOOGLE_PLACES_API_KEY;

  afterEach(() => {
    process.env.EXTERNAL_API_MODE = originalMode;
    process.env.GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("falls back to mock mode if live mode is requested without Google Places key", () => {
    process.env.EXTERNAL_API_MODE = "live";
    process.env.GOOGLE_PLACES_API_KEY = "";
    const env = getServerEnv();
    expect(env.effectiveExternalMode).toBe("mock");
    expect(env.hasGooglePlacesKey).toBe(false);
  });

  it("enables live mode only when both EXTERNAL_API_MODE=live and API key are provided", () => {
    process.env.EXTERNAL_API_MODE = "live";
    process.env.GOOGLE_PLACES_API_KEY = "test-places-key";
    const env = getServerEnv();
    expect(env.effectiveExternalMode).toBe("live");
    expect(env.hasGooglePlacesKey).toBe(true);
  });
});
