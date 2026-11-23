export interface FoodCategoryOption {
  slug: string;
  nameTh: string;
  nameEn: string;
  icon: string;
}

export const FOOD_CATEGORIES: FoodCategoryOption[] = [
  { slug: "thai", nameTh: "อาหารไทย", nameEn: "Thai", icon: "flame" },
  { slug: "japanese", nameTh: "อาหารญี่ปุ่น", nameEn: "Japanese", icon: "fish" },
  { slug: "korean", nameTh: "อาหารเกาหลี", nameEn: "Korean", icon: "soup" },
  { slug: "chinese", nameTh: "อาหารจีน", nameEn: "Chinese", icon: "utensils" },
  { slug: "italian", nameTh: "อาหารอิตาเลียน", nameEn: "Italian", icon: "pizza" },
  { slug: "fast-food", nameTh: "ฟาสต์ฟู้ด", nameEn: "Fast Food", icon: "sandwich" },
];

export interface BudgetOption {
  id: "ANY" | "BUDGET" | "MODERATE" | "PREMIUM";
  labelTh: string;
  rangeTh: string;
}

export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: "ANY", labelTh: "ไม่จำกัดงบ", rangeTh: "ทุกราคา" },
  { id: "BUDGET", labelTh: "ประหยัด", rangeTh: "ไม่เกิน ฿100" },
  { id: "MODERATE", labelTh: "ปานกลาง", rangeTh: "฿101 – ฿300" },
  { id: "PREMIUM", labelTh: "จัดเต็ม", rangeTh: "มากกว่า ฿300" },
];

export const DISTANCE_OPTIONS_KM = [1, 3, 5, 10, 20] as const;
export type DistanceKm = (typeof DISTANCE_OPTIONS_KM)[number];

export interface MealTypeOption {
  id: "ANY" | "BREAKFAST" | "LUNCH" | "DINNER" | "LATE_NIGHT" | "SNACK";
  labelTh: string;
}

export const MEAL_TYPE_OPTIONS: MealTypeOption[] = [
  { id: "ANY", labelTh: "ทุกมื้อ" },
  { id: "BREAKFAST", labelTh: "มื้อเช้า" },
  { id: "LUNCH", labelTh: "มื้อกลางวัน" },
  { id: "DINNER", labelTh: "มื้อเย็น" },
  { id: "LATE_NIGHT", labelTh: "มื้อดึก" },
  { id: "SNACK", labelTh: "ของว่าง" },
];

export interface DistrictArea {
  province: string;
  district: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_LOCATION_AREAS: DistrictArea[] = [
  { province: "กรุงเทพมหานคร", district: "ปทุมวัน", latitude: 13.7447, longitude: 100.5335 },
  { province: "กรุงเทพมหานคร", district: "วัฒนา", latitude: 13.7393, longitude: 100.5784 },
  { province: "กรุงเทพมหานคร", district: "จตุจักร", latitude: 13.8161, longitude: 100.5612 },
  { province: "กรุงเทพมหานคร", district: "บางรัก", latitude: 13.7294, longitude: 100.5256 },
  { province: "เชียงใหม่", district: "เมืองเชียงใหม่", latitude: 18.7883, longitude: 98.9853 },
  { province: "ภูเก็ต", district: "เมืองภูเก็ต", latitude: 7.8804, longitude: 98.3923 },
  { province: "ชลบุรี", district: "บางละมุง", latitude: 12.9236, longitude: 100.8825 },
  { province: "ขอนแก่น", district: "เมืองขอนแก่น", latitude: 16.4322, longitude: 102.8236 },
];
