import { DISTANCE_OPTIONS_KM, type DistanceKm } from "@/lib/constants";
import { getPublicConfig } from "@/lib/env";
import {
  DEFAULT_SELECTED_LOCATION,
  findDistrictByNames,
  findNearestDistrict,
  type SelectedLocation,
} from "@/lib/locations";
import { RestaurantFinderClient } from "@/components/restaurants/RestaurantFinderClient";

interface RestaurantsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseRadiusKm(raw?: string): DistanceKm {
  const num = Number(raw);
  if ((DISTANCE_OPTIONS_KM as readonly number[]).includes(num)) {
    return num as DistanceKm;
  }
  return 5;
}

function resolveInitialLocation(
  params: Record<string, string | string[] | undefined>
): SelectedLocation {
  const latStr = typeof params.lat === "string" ? params.lat : undefined;
  const lngStr = typeof params.lng === "string" ? params.lng : undefined;
  const areaStr = typeof params.area === "string" ? params.area : undefined;
  const locMode = typeof params.locMode === "string" ? params.locMode : undefined;

  const lat = latStr !== undefined ? Number(latStr) : Number.NaN;
  const lng = lngStr !== undefined ? Number(lngStr) : Number.NaN;

  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    if (locMode === "gps") {
      return {
        mode: "gps",
        latitude: lat,
        longitude: lng,
        label: `ตำแหน่ง GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }

    if (areaStr && areaStr.includes(",")) {
      const [districtPart, provincePart] = areaStr
        .split(",")
        .map((s) => s.trim());
      const matched = findDistrictByNames(provincePart, districtPart);
      if (matched) return matched;
    }

    const nearest = findNearestDistrict(lat, lng);
    return {
      mode: "area",
      latitude: lat,
      longitude: lng,
      province: nearest.province,
      district: nearest.district,
      label: areaStr || `${nearest.district}, ${nearest.province}`,
    };
  }

  return DEFAULT_SELECTED_LOCATION;
}

export default async function RestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const params = await searchParams;
  const publicConfig = getPublicConfig();

  const initialLocation = resolveInitialLocation(params);
  const hasExplicitLocationParams =
    typeof params.lat === "string" && typeof params.lng === "string";
  const initialRadiusKm = parseRadiusKm(
    typeof params.radiusKm === "string" ? params.radiusKm : undefined
  );
  const menuId = typeof params.menuId === "string" ? params.menuId : undefined;
  const menuSlug =
    typeof params.menuSlug === "string" ? params.menuSlug : undefined;
  const menuName =
    typeof params.menuName === "string" ? params.menuName : undefined;

  return (
    <RestaurantFinderClient
      initialLocation={initialLocation}
      hasExplicitLocationParams={hasExplicitLocationParams}
      initialRadiusKm={initialRadiusKm}
      initialMenuId={menuId}
      initialMenuSlug={menuSlug}
      initialMenuName={menuName}
      externalApiMode={publicConfig.externalApiMode}
      hasGoogleMapsKey={publicConfig.hasGoogleMapsKey}
    />
  );
}
