import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { apiError } from "@/server/api-response";

export const dynamic = "force-dynamic";

const streetViewQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * Server-side proxy for Google Street View Static API.
 * Used as a real storefront photo fallback in "live" mode when Google Places
 * returns no photo references, while keeping GOOGLE_PLACES_API_KEY strictly server-side.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (env.effectiveExternalMode !== "live" || !env.hasGooglePlacesKey) {
    return apiError(
      "EXTERNAL_API_ERROR",
      "Street View proxy ใช้ได้เฉพาะเมื่อเปิดโหมด Live และตั้งค่า GOOGLE_PLACES_API_KEY แล้วเท่านั้น",
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = streetViewQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "พิกัด lat/lng ไม่ถูกต้อง", {
      status: 400,
    });
  }

  const lat = parsed.data.lat.toFixed(6);
  const lng = parsed.data.lng.toFixed(6);

  try {
    const upstreamUrl =
      `https://maps.googleapis.com/maps/api/streetview` +
      `?size=640x400&location=${lat},${lng}&source=outdoor&return_error_code=true` +
      `&key=${encodeURIComponent(env.GOOGLE_PLACES_API_KEY)}`;

    const upstream = await fetch(upstreamUrl, { cache: "force-cache" });

    if (upstream.status === 404) {
      return apiError("NOT_FOUND", "ไม่พบภาพ Street View บริเวณพิกัดนี้", {
        status: 404,
      });
    }

    if (!upstream.ok) {
      return apiError("EXTERNAL_API_ERROR", "ไม่สามารถโหลดภาพหน้าร้านจาก Street View ได้", {
        status: 502,
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
      },
    });
  } catch {
    return apiError("EXTERNAL_API_ERROR", "เกิดข้อผิดพลาดในการโหลดภาพ Street View", {
      status: 502,
    });
  }
}
