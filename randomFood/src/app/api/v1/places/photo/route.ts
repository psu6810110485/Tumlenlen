import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { apiError } from "@/server/api-response";

export const dynamic = "force-dynamic";

const GOOGLE_PHOTO_NAME_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

/**
 * Server-side proxy for Google Places API (New) photos.
 * Keeps GOOGLE_PLACES_API_KEY strictly on the server (never exposed to browser).
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (env.effectiveExternalMode !== "live" || !env.hasGooglePlacesKey) {
    return apiError(
      "EXTERNAL_API_ERROR",
      "Photo proxy ใช้ได้เฉพาะเมื่อเปิดโหมด Live และตั้งค่า GOOGLE_PLACES_API_KEY แล้วเท่านั้น",
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() ?? "";
  const rawMaxWidth = Number(searchParams.get("maxWidthPx") ?? "800");
  const maxWidthPx = Number.isFinite(rawMaxWidth)
    ? Math.min(Math.max(Math.round(rawMaxWidth), 200), 1600)
    : 800;

  if (!GOOGLE_PHOTO_NAME_REGEX.test(name)) {
    return apiError("VALIDATION_ERROR", "รูปแบบชื่อรูปภาพไม่ถูกต้อง", {
      status: 400,
    });
  }

  try {
    const upstreamUrl = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx}`;
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      },
    });

    if (!upstream.ok) {
      return apiError("EXTERNAL_API_ERROR", "ไม่สามารถโหลดรูปภาพร้านอาหารได้", {
        status: 502,
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return apiError("EXTERNAL_API_ERROR", "เกิดข้อผิดพลาดในการโหลดรูปภาพ", {
      status: 502,
    });
  }
}
