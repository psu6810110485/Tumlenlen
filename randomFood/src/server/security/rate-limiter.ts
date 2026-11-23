import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { apiError } from "@/server/api-response";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * In-memory fixed-window Rate Limiter with automatic stale bucket cleanup.
 * Protects Auth, Reviews, and Google Places API quota against abuse.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly maxBuckets: number;

  constructor(maxBuckets = 2000) {
    this.maxBuckets = maxBuckets;
  }

  check(
    key: string,
    maxRequests: number,
    windowMs: number,
    now = Date.now()
  ): RateLimitCheckResult {
    const existing = this.buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      if (this.buckets.size >= this.maxBuckets) {
        for (const [k, b] of this.buckets.entries()) {
          if (now >= b.resetAt) this.buckets.delete(k);
        }
        if (this.buckets.size >= this.maxBuckets) {
          const oldest = this.buckets.keys().next().value;
          if (oldest !== undefined) this.buckets.delete(oldest);
        }
      }

      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - 1),
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    existing.count += 1;
    const allowed = existing.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - existing.count);
    const retryAfterSeconds = allowed
      ? 0
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  clear(): void {
    this.buckets.clear();
  }
}

const globalForRateLimiter = globalThis as unknown as {
  frRateLimiter: RateLimiter | undefined;
};

export const apiRateLimiter =
  globalForRateLimiter.frRateLimiter ?? new RateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimiter.frRateLimiter = apiRateLimiter;
}

export function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "local";
}

/**
 * Enforces rate limiting for a given route scope.
 * Returns a 429 NextResponse if limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(
  request: NextRequest,
  options: {
    scope: string;
    maxRequests?: number;
    windowMs?: number;
  }
): NextResponse | null {
  const env = getServerEnv();
  const maxRequests = options.maxRequests ?? env.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const clientIp = extractClientIp(request);

  const result = apiRateLimiter.check(
    `${options.scope}:${clientIp}`,
    maxRequests,
    windowMs
  );

  if (result.allowed) {
    return null;
  }

  const response = apiError(
    "RATE_LIMITED",
    "คุณส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
    { status: 429 }
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return response;
}
