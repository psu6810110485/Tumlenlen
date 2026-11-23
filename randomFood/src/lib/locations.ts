export interface DistrictOption {
  district: string;
  latitude: number;
  longitude: number;
}

export interface ProvinceOption {
  province: string;
  region: string;
  districts: DistrictOption[];
}

export interface SelectedLocation {
  mode: "gps" | "area";
  latitude: number;
  longitude: number;
  province?: string;
  district?: string;
  label: string;
}

/**
 * Curated Thailand Provinces & Districts with accurate WGS84 centroids
 * for manual location selection when GPS is unavailable or declined.
 */
export const THAILAND_PROVINCES: ProvinceOption[] = [
  {
    province: "กรุงเทพมหานคร",
    region: "ภาคกลาง",
    districts: [
      { district: "ปทุมวัน", latitude: 13.7447, longitude: 100.5335 },
      { district: "วัฒนา", latitude: 13.7393, longitude: 100.5784 },
      { district: "จตุจักร", latitude: 13.8161, longitude: 100.5612 },
      { district: "บางรัก", latitude: 13.7294, longitude: 100.5256 },
      { district: "ห้วยขวาง", latitude: 13.7767, longitude: 100.5794 },
      { district: "พญาไท", latitude: 13.7801, longitude: 100.5428 },
      { district: "คลองเตย", latitude: 13.7082, longitude: 100.5838 },
      { district: "บางนา", latitude: 13.6682, longitude: 100.6048 },
    ],
  },
  {
    province: "นนทบุรี",
    region: "ภาคกลาง",
    districts: [
      { district: "เมืองนนทบุรี", latitude: 13.8591, longitude: 100.5217 },
      { district: "ปากเกร็ด", latitude: 13.9126, longitude: 100.4985 },
      { district: "บางใหญ่", latitude: 13.8768, longitude: 100.4112 },
    ],
  },
  {
    province: "สมุทรปราการ",
    region: "ภาคกลาง",
    districts: [
      { district: "เมืองสมุทรปราการ", latitude: 13.5991, longitude: 100.5998 },
      { district: "บางพลี", latitude: 13.6085, longitude: 100.7135 },
    ],
  },
  {
    province: "เชียงใหม่",
    region: "ภาคเหนือ",
    districts: [
      { district: "เมืองเชียงใหม่", latitude: 18.7883, longitude: 98.9853 },
      { district: "หางดง", latitude: 18.6869, longitude: 98.9189 },
      { district: "สันทราย", latitude: 18.8878, longitude: 99.0439 },
    ],
  },
  {
    province: "ภูเก็ต",
    region: "ภาคใต้",
    districts: [
      { district: "เมืองภูเก็ต", latitude: 7.8804, longitude: 98.3923 },
      { district: "กะทู้", latitude: 7.9082, longitude: 98.3324 },
      { district: "ถลาง", latitude: 8.0315, longitude: 98.3341 },
    ],
  },
  {
    province: "ชลบุรี",
    region: "ภาคตะวันออก",
    districts: [
      { district: "บางละมุง", latitude: 12.9236, longitude: 100.8825 },
      { district: "เมืองชลบุรี", latitude: 13.3611, longitude: 100.9847 },
      { district: "ศรีราชา", latitude: 13.1737, longitude: 100.9311 },
    ],
  },
  {
    province: "ขอนแก่น",
    region: "ภาคตะวันออกเฉียงเหนือ",
    districts: [
      { district: "เมืองขอนแก่น", latitude: 16.4322, longitude: 102.8236 },
      { district: "บ้านไผ่", latitude: 16.0598, longitude: 102.7309 },
    ],
  },
  {
    province: "นครราชสีมา",
    region: "ภาคตะวันออกเฉียงเหนือ",
    districts: [
      { district: "เมืองนครราชสีมา", latitude: 14.9799, longitude: 102.0978 },
      { district: "ปากช่อง", latitude: 14.7082, longitude: 101.4161 },
    ],
  },
  {
    province: "สงขลา",
    region: "ภาคใต้",
    districts: [
      { district: "หาดใหญ่", latitude: 7.0086, longitude: 100.4747 },
      { district: "เมืองสงขลา", latitude: 7.1897, longitude: 100.5954 },
    ],
  },
];

export const DEFAULT_SELECTED_LOCATION: SelectedLocation = {
  mode: "area",
  latitude: THAILAND_PROVINCES[0].districts[0].latitude,
  longitude: THAILAND_PROVINCES[0].districts[0].longitude,
  province: THAILAND_PROVINCES[0].province,
  district: THAILAND_PROVINCES[0].districts[0].district,
  label: `${THAILAND_PROVINCES[0].districts[0].district}, ${THAILAND_PROVINCES[0].province}`,
};

export function findDistrictByNames(
  provinceName?: string,
  districtName?: string
): SelectedLocation | null {
  if (!provinceName) return null;
  const prov = THAILAND_PROVINCES.find((p) => p.province === provinceName);
  if (!prov) return null;

  const dist =
    prov.districts.find((d) => d.district === districtName) ?? prov.districts[0];
  return {
    mode: "area",
    latitude: dist.latitude,
    longitude: dist.longitude,
    province: prov.province,
    district: dist.district,
    label: `${dist.district}, ${prov.province}`,
  };
}

export function findNearestDistrict(
  latitude: number,
  longitude: number
): { province: string; district: string } {
  let best = {
    province: THAILAND_PROVINCES[0].province,
    district: THAILAND_PROVINCES[0].districts[0].district,
    distSq: Number.POSITIVE_INFINITY,
  };

  for (const prov of THAILAND_PROVINCES) {
    for (const dist of prov.districts) {
      const dLat = dist.latitude - latitude;
      const dLng = dist.longitude - longitude;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < best.distSq) {
        best = {
          province: prov.province,
          district: dist.district,
          distSq,
        };
      }
    }
  }

  return { province: best.province, district: best.district };
}
