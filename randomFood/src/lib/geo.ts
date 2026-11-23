/**
 * Geographic utilities for Food Roulette.
 * Used for distance calculations in fallback/mock mode and coordinate formatting.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two WGS84 coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Formats distance in km into readable Thai units (m for < 1 km, km otherwise).
 */
export function formatDistanceTh(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.max(10, Math.round(distanceKm * 1000));
    return `${meters} ม.`;
  }
  return `${distanceKm.toFixed(1)} กม.`;
}

/**
 * Builds an official Google Maps directions/search URL using coordinates and name.
 */
export function buildGoogleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
  placeName?: string
): string {
  const query = placeName
    ? `${placeName} ${latitude},${longitude}`
    : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
