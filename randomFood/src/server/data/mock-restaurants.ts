import type { MenuVerificationStatus, PriceTier } from "@prisma/client";
import type { RestaurantOpeningHours } from "@/server/types/restaurant";

export interface MockRestaurantMenuEvidence {
  menuSlug: string;
  verificationStatus: MenuVerificationStatus;
  evidenceSource: string;
  price: number;
}

export interface MockRestaurantSeed {
  id: string;
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string;
  priceLevel: 1 | 2 | 3 | 4;
  priceTier: PriceTier;
  estimatedMinPrice: number;
  estimatedMaxPrice: number;
  googleRating: number;
  googleReviewCount: number;
  appRatingAvg: number | null;
  appReviewCount: number;
  openingHours: RestaurantOpeningHours;
  photoUrls: string[];
  categories: string[];
  menuEvidence: MockRestaurantMenuEvidence[];
}

/**
 * Clearly-labeled MOCK restaurant fixtures used ONLY when EXTERNAL_API_MODE="mock"
 * (or when Google Places API key is not configured).
 * Never silently substituted in "live" mode.
 */
export const MOCK_RESTAURANTS: MockRestaurantSeed[] = [
  // ===================== BANGKOK — PATHUM WAN / SIAM =====================
  {
    id: "mock-rest-bkk-01",
    name: "ครัวกะเพราไฟแรง สยามสแควร์ (Mock)",
    address: "254 ซอยจุฬาลงกรณ์ 64 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7456,
    longitude: 100.5349,
    phone: "02-000-1001",
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 60,
    estimatedMaxPrice: 95,
    googleRating: 4.6,
    googleReviewCount: 342,
    appRatingAvg: 4.7,
    appReviewCount: 18,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 21:30",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 21:30"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 75,
      },
      {
        menuSlug: "khao-man-gai",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวดอาหารตามสั่ง)",
        price: 70,
      },
    ],
  },
  {
    id: "mock-rest-bkk-02",
    name: "ส้มตำแซ่บปทุมวัน & ไก่ย่างเขาสวนกวาง (Mock)",
    address: "388 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7421,
    longitude: 100.5308,
    phone: "02-000-1002",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 110,
    estimatedMaxPrice: 240,
    googleRating: 4.5,
    googleReviewCount: 518,
    appRatingAvg: 4.4,
    appReviewCount: 12,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 22:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 165,
      },
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากประเภทอาหารไทย)",
        price: 135,
      },
    ],
  },
  {
    id: "mock-rest-bkk-03",
    name: "ฮากาตะ ราเมง เฮาส์ ปทุมวัน (Mock)",
    address: "991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7468,
    longitude: 100.5352,
    phone: "02-000-1003",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 190,
    estimatedMaxPrice: 320,
    googleRating: 4.7,
    googleReviewCount: 890,
    appRatingAvg: 4.8,
    appReviewCount: 25,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:30 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:30 – 22:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["japanese"],
    menuEvidence: [
      {
        menuSlug: "tonkotsu-ramen",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 235,
      },
      {
        menuSlug: "salmon-don",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวดอาหารญี่ปุ่น)",
        price: 260,
      },
    ],
  },
  {
    id: "mock-rest-bkk-04",
    name: "โซล ชิกเก้น & ต๊อกบกกี บรรทัดทอง (Mock)",
    address: "1420 ถนนบรรทัดทอง แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7412,
    longitude: 100.5234,
    phone: "02-000-1004",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 150,
    estimatedMaxPrice: 290,
    googleRating: 4.4,
    googleReviewCount: 412,
    appRatingAvg: null,
    appReviewCount: 0,
    openingHours: {
      isOpenNow: true,
      todayHours: "12:00 – 23:30",
      weekdayText: ["จันทร์–อาทิตย์: 12:00 – 23:30"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["korean"],
    menuEvidence: [
      {
        menuSlug: "korean-fried-chicken",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 210,
      },
    ],
  },
  {
    id: "mock-rest-bkk-05",
    name: "หอติ่มซำฮ่องกง สามย่าน (Mock)",
    address: "944 ถนนพระราม 4 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7336,
    longitude: 100.5286,
    phone: "02-000-1005",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 120,
    estimatedMaxPrice: 280,
    googleRating: 4.5,
    googleReviewCount: 276,
    appRatingAvg: 4.6,
    appReviewCount: 9,
    openingHours: {
      isOpenNow: true,
      todayHours: "08:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 08:00 – 21:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["chinese"],
    menuEvidence: [
      {
        menuSlug: "dim-sum-basket",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 180,
      },
    ],
  },
  {
    id: "mock-rest-bkk-06",
    name: "ทราทโทเรีย พาสต้า & พิซซ่า เตาถ่าน (Mock)",
    address: "55 ซอยหลังสวน แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7399,
    longitude: 100.5435,
    phone: "02-000-1006",
    priceLevel: 3,
    priceTier: "PREMIUM",
    estimatedMinPrice: 320,
    estimatedMaxPrice: 650,
    googleRating: 4.8,
    googleReviewCount: 620,
    appRatingAvg: 4.9,
    appReviewCount: 14,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:30 – 22:30",
      weekdayText: ["จันทร์–อาทิตย์: 11:30 – 22:30"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["italian"],
    menuEvidence: [
      {
        menuSlug: "spaghetti-carbonara",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 340,
      },
      {
        menuSlug: "margherita-pizza",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 380,
      },
    ],
  },
  {
    id: "mock-rest-bkk-07",
    name: "สแมช เบอร์เกอร์ คลับ ราชเทวี (Mock)",
    address: "112 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400",
    province: "กรุงเทพมหานคร",
    district: "พญาไท",
    latitude: 13.7534,
    longitude: 100.5317,
    phone: "02-000-1007",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 165,
    estimatedMaxPrice: 280,
    googleRating: 4.6,
    googleReviewCount: 445,
    appRatingAvg: 4.5,
    appReviewCount: 11,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 23:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 23:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["fast-food"],
    menuEvidence: [
      {
        menuSlug: "smash-cheeseburger",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 215,
      },
    ],
  },

  // ===================== BANGKOK — WATTHANA / THONGLOR / ASOKE =====================
  {
    id: "mock-rest-bkk-08",
    name: "อิซากายะ แซลมอนด้ง ทองหล่อ (Mock)",
    address: "235 สุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7368,
    longitude: 100.5819,
    phone: "02-000-1008",
    priceLevel: 3,
    priceTier: "PREMIUM",
    estimatedMinPrice: 310,
    estimatedMaxPrice: 590,
    googleRating: 4.7,
    googleReviewCount: 731,
    appRatingAvg: 4.6,
    appReviewCount: 16,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:30 – 23:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:30 – 23:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["japanese"],
    menuEvidence: [
      {
        menuSlug: "salmon-don",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 340,
      },
      {
        menuSlug: "tonkotsu-ramen",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวดอาหารญี่ปุ่น)",
        price: 260,
      },
    ],
  },
  {
    id: "mock-rest-bkk-09",
    name: "ผัดไทยกุ้งสด อโศก สเตชัน (Mock)",
    address: "42 ซอยสุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7405,
    longitude: 100.5616,
    phone: "02-000-1009",
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 65,
    estimatedMaxPrice: 120,
    googleRating: 4.3,
    googleReviewCount: 289,
    appRatingAvg: 4.2,
    appReviewCount: 7,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 20:30",
      weekdayText: ["จันทร์–เสาร์: 10:00 – 20:30", "อาทิตย์: ปิดทำการ"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 95,
      },
    ],
  },

  // ===================== BANGKOK — CHATUCHAK / BANG RAK =====================
  {
    id: "mock-rest-bkk-10",
    name: "ข้าวมันไก่ไหหลำ อารีย์-จตุจักร (Mock)",
    address: "1088 ถนนพหลโยธิน แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900",
    province: "กรุงเทพมหานคร",
    district: "จตุจักร",
    latitude: 13.8124,
    longitude: 100.5588,
    phone: "02-000-1010",
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 55,
    estimatedMaxPrice: 90,
    googleRating: 4.5,
    googleReviewCount: 615,
    appRatingAvg: 4.7,
    appReviewCount: 21,
    openingHours: {
      isOpenNow: true,
      todayHours: "07:00 – 16:00",
      weekdayText: ["จันทร์–อาทิตย์: 07:00 – 16:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai", "chinese"],
    menuEvidence: [
      {
        menuSlug: "khao-man-gai",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 65,
      },
    ],
  },
  {
    id: "mock-rest-bkk-11",
    name: "ครัวสีลม อาหารไทยต้นตำรับ (Mock)",
    address: "88 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500",
    province: "กรุงเทพมหานคร",
    district: "บางรัก",
    latitude: 13.7279,
    longitude: 100.5294,
    phone: "02-000-1011",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 95,
    estimatedMaxPrice: 220,
    googleRating: 4.4,
    googleReviewCount: 380,
    appRatingAvg: 4.5,
    appReviewCount: 10,
    openingHours: {
      isOpenNow: false,
      todayHours: "11:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 21:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 105,
      },
    ],
  },

  // ===================== CHIANG MAI =====================
  {
    id: "mock-rest-cnx-01",
    name: "ครัวล้านนา นิมมานเหมินท์ (Mock)",
    address: "42 ถนนนิมมานเหมินท์ ซอย 9 ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    latitude: 18.7965,
    longitude: 98.9678,
    phone: "053-000-2001",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 80,
    estimatedMaxPrice: 180,
    googleRating: 4.7,
    googleReviewCount: 920,
    appRatingAvg: 4.8,
    appReviewCount: 19,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 21:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 85,
      },
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวดอาหารไทย)",
        price: 120,
      },
    ],
  },
  {
    id: "mock-rest-cnx-02",
    name: "ซัปโปโร ราเมง เชียงใหม่ (Mock)",
    address: "18 ถนนห้วยแก้ว ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    latitude: 18.8021,
    longitude: 98.9721,
    phone: "053-000-2002",
    priceLevel: 2,
    priceTier: "MODERATE",
    estimatedMinPrice: 160,
    estimatedMaxPrice: 280,
    googleRating: 4.6,
    googleReviewCount: 410,
    appRatingAvg: null,
    appReviewCount: 0,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 21:30",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 21:30"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["japanese"],
    menuEvidence: [
      {
        menuSlug: "tonkotsu-ramen",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 195,
      },
    ],
  },

  // ===================== PHUKET =====================
  {
    id: "mock-rest-hkt-01",
    name: "ครัวเมืองเก่า ภูเก็ต & ติ่มซำ (Mock)",
    address: "76 ถนนถลาง ตำบลตลาดใหญ่ อำเภอเมืองภูเก็ต ภูเก็ต 83000",
    province: "ภูเก็ต",
    district: "เมืองภูเก็ต",
    latitude: 7.8848,
    longitude: 98.3895,
    phone: "076-000-3001",
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 70,
    estimatedMaxPrice: 150,
    googleRating: 4.6,
    googleReviewCount: 540,
    appRatingAvg: 4.7,
    appReviewCount: 13,
    openingHours: {
      isOpenNow: true,
      todayHours: "07:30 – 19:00",
      weekdayText: ["จันทร์–อาทิตย์: 07:30 – 19:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai", "chinese"],
    menuEvidence: [
      {
        menuSlug: "dim-sum-basket",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 130,
      },
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 110,
      },
    ],
  },

  // ===================== CHONBURI =====================
  {
    id: "mock-rest-cbi-01",
    name: "ซีบรีซ กริลล์ & พาสต้า พัทยา (Mock)",
    address: "210 ถนนเลียบชายหาด ตำบลหนองปรือ อำเภอบางละมุง ชลบุรี 20150",
    province: "ชลบุรี",
    district: "บางละมุง",
    latitude: 12.9312,
    longitude: 100.8841,
    phone: "038-000-4001",
    priceLevel: 3,
    priceTier: "PREMIUM",
    estimatedMinPrice: 280,
    estimatedMaxPrice: 550,
    googleRating: 4.5,
    googleReviewCount: 485,
    appRatingAvg: 4.5,
    appReviewCount: 8,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 23:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 23:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["italian", "fast-food"],
    menuEvidence: [
      {
        menuSlug: "spaghetti-carbonara",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 290,
      },
      {
        menuSlug: "smash-cheeseburger",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวด Grill & Burger)",
        price: 260,
      },
    ],
  },

  // ===================== KHON KAEN =====================
  {
    id: "mock-rest-kkc-01",
    name: "ไก่ย่างขอนแก่น & ส้มตำต้นตำรับ (Mock)",
    address: "155 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองขอนแก่น ขอนแก่น 40000",
    province: "ขอนแก่น",
    district: "เมืองขอนแก่น",
    latitude: 16.4368,
    longitude: 102.8285,
    phone: "043-000-5001",
    priceLevel: 1,
    priceTier: "BUDGET",
    estimatedMinPrice: 60,
    estimatedMaxPrice: 160,
    googleRating: 4.7,
    googleReviewCount: 680,
    appRatingAvg: 4.8,
    appReviewCount: 15,
    openingHours: {
      isOpenNow: true,
      todayHours: "09:30 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 09:30 – 21:00"],
    },
    photoUrls: [
      "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=900&q=80",
    ],
    categories: ["thai"],
    menuEvidence: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "VERIFIED",
        evidenceSource: "Mock Verified Menu Catalog (ตัวอย่างรายการอาหารยืนยันแล้ว)",
        price: 135,
      },
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "INFERRED",
        evidenceSource: "Mock Keyword Inference (คาดการณ์จากหมวดอาหารไทย)",
        price: 65,
      },
    ],
  },
];
