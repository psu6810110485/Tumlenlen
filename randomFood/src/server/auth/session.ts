import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

export interface SessionPayload {
  userId: string;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  exp: number; // Unix timestamp in seconds
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSigningSecret(): string {
  const env = getServerEnv();
  if (env.AUTH_JWT_SECRET && env.AUTH_JWT_SECRET.trim().length >= 16) {
    return env.AUTH_JWT_SECRET.trim();
  }
  if (env.NODE_ENV === "production") {
    throw new Error("AUTH_JWT_SECRET must be configured in production");
  }
  return "dev-only-food-roulette-session-secret-change-in-prod";
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");
}

function sign(encodedPayload: string): string {
  const hmac = createHmac("sha256", getSigningSecret());
  hmac.update(encodedPayload);
  return base64UrlEncode(hmac.digest());
}

export function createSessionToken(
  user: Omit<SessionPayload, "exp">,
  ttlSeconds = SESSION_MAX_AGE_SECONDS
): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = sign(encodedPayload);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (
      !decoded ||
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  user: Omit<SessionPayload, "exp">
): void {
  const env = getServerEnv();
  const token = createSessionToken(user);

  response.cookies.set(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  const env = getServerEnv();
  response.cookies.set(env.AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const env = getServerEnv();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
