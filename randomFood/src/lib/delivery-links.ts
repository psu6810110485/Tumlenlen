export type DeliveryProvider = "GRABFOOD" | "LINEMAN";

export interface DeliveryLink {
  provider: DeliveryProvider;
  label: string;
  shortLabel: string;
  url: string;
  isVerifiedDirectUrl: boolean;
}

const ALLOWED_HOSTS: Record<DeliveryProvider, string[]> = {
  GRABFOOD: ["food.grab.com", "www.grab.com", "grab.com"],
  LINEMAN: ["lineman.line.me", "www.wongnai.com", "wongnai.com"],
};

/**
 * Validates that a stored direct delivery URL is HTTPS and belongs to
 * an official whitelisted GrabFood or LINE MAN domain.
 */
export function isVerifiedDeliveryUrl(
  rawUrl: string | null | undefined,
  provider: DeliveryProvider
): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOSTS[provider].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

/**
 * Builds GrabFood and LINE MAN links obeying Rule 4:
 * - Uses direct store URLs ONLY if verified and whitelisted.
 * - Otherwise returns transparent Search Fallback URLs (never fabricates fake store URLs).
 */
export function buildDeliveryLinks(
  restaurantName: string,
  verifiedGrabUrl?: string | null,
  verifiedLineManUrl?: string | null
): DeliveryLink[] {
  const cleanName = restaurantName.replace(/\s*\(Mock\)\s*/gi, "").trim();
  const hasValidGrab = isVerifiedDeliveryUrl(verifiedGrabUrl, "GRABFOOD");
  const hasValidLineMan = isVerifiedDeliveryUrl(verifiedLineManUrl, "LINEMAN");

  return [
    hasValidGrab
      ? {
          provider: "GRABFOOD",
          label: "สั่งผ่าน GrabFood",
          shortLabel: "GrabFood",
          url: verifiedGrabUrl!.trim(),
          isVerifiedDirectUrl: true,
        }
      : {
          provider: "GRABFOOD",
          label: "ค้นหาร้านบน GrabFood",
          shortLabel: "ค้นหา GrabFood",
          url: `https://food.grab.com/th/th/restaurants?search=${encodeURIComponent(cleanName)}`,
          isVerifiedDirectUrl: false,
        },
    hasValidLineMan
      ? {
          provider: "LINEMAN",
          label: "สั่งผ่าน LINE MAN",
          shortLabel: "LINE MAN",
          url: verifiedLineManUrl!.trim(),
          isVerifiedDirectUrl: true,
        }
      : {
          provider: "LINEMAN",
          label: "ค้นหาร้านบน LINE MAN",
          shortLabel: "ค้นหา LINE MAN",
          url: `https://www.wongnai.com/restaurants?q=${encodeURIComponent(cleanName)}`,
          isVerifiedDirectUrl: false,
        },
  ];
}
