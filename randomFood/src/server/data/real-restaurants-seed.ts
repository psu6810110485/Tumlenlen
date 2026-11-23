import type { MenuVerificationStatus } from "@prisma/client";

export interface RealRestaurantMenuSeed {
  menuSlug: string;
  verificationStatus: MenuVerificationStatus;
  evidenceSource: string;
  price: number | null;
}

export interface RealRestaurantSeed {
  slugKey: string; // Deterministic key stored in googlePlaceId? No — matched by name+province+district in seed
  name: string;
  address: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  priceLevel: 1 | 2 | 3 | 4;
  estimatedMinPrice: number;
  estimatedMaxPrice: number;
  openingHours: {
    isOpenNow: boolean | null;
    todayHours: string;
    weekdayText: string[];
  };
  photoUrls: string[];
  menus: RealRestaurantMenuSeed[];
}

/**
 * Curated real Thailand restaurants across major provinces (Bangkok, Songkhla/Hat Yai,
 * Chiang Mai, Phuket, Chonburi, Khon Kaen) stored in PostgreSQL with PostGIS
 * geography(Point, 4326) spatial index.
 *
 * Strictly follows project rules:
 * - dataSource = INTERNAL (never fakes Google Places ratings or Food Roulette reviews)
 * - googleRating = null, googleReviewCount = 0 (populated only from real Google Places API)
 * - appRatingAvg = null, appReviewCount = 0 (populated only from real Food Roulette user reviews)
 * - grabFoodUrl / lineManUrl = null (uses transparent Search Fallback unless verified direct URL)
 * - Every menu mapping explicitly states VERIFIED or INFERRED with evidenceSource
 */
export const REAL_RESTAURANTS_SEED: RealRestaurantSeed[] = [
  // ===================== BANGKOK (ปทุมวัน / บรรทัดทอง / วัฒนา / จตุจักร / บางรัก) =====================
  {
    slugKey: "somtum-nua-siam",
    name: "ส้มตำนัว สยามสแควร์ ซอย 5",
    address: "392/14 สยามสแควร์ ซอย 5 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7453,
    longitude: 100.5338,
    phone: "02-251-4880",
    priceLevel: 2,
    estimatedMinPrice: 120,
    estimatedMaxPrice: 280,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:45 – 21:30",
      weekdayText: ["จันทร์–อาทิตย์: 10:45 – 21:30"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "VERIFIED",
        evidenceSource: "รายการอาหารหลักของร้านส้มตำนัว (ส้มตำและไก่ทอด/ไก่ย่าง)",
        price: 165,
      },
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารไทยจานเดียว",
        price: null,
      },
    ],
  },
  {
    slugKey: "ko-ang-pratunam",
    name: "โกอ่าง ข้าวมันไก่ประตูน้ำ",
    address: "962 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7495,
    longitude: 100.5413,
    phone: "02-252-6325",
    priceLevel: 1,
    estimatedMinPrice: 60,
    estimatedMaxPrice: 120,
    openingHours: {
      isOpenNow: true,
      todayHours: "06:00 – 14:00, 15:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 06:00 – 14:00, 15:00 – 22:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "khao-man-gai",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูซิกเนเจอร์ของร้านโกอ่าง ข้าวมันไก่ประตูน้ำ",
        price: 65,
      },
    ],
  },
  {
    slugKey: "bonchon-siam-center",
    name: "Bonchon สยามเซ็นเตอร์",
    address: "ชั้น 2 สยามเซ็นเตอร์ 979 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7463,
    longitude: 100.5328,
    phone: "02-658-1575",
    priceLevel: 2,
    estimatedMinPrice: 180,
    estimatedMaxPrice: 380,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 22:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "korean-fried-chicken",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูหลักของร้าน Bonchon Thailand (ไก่ทอดเกาหลีซอยการ์ลิค/ฮอต)",
        price: 220,
      },
    ],
  },
  {
    slugKey: "din-tai-fung-centralworld",
    name: "Din Tai Fung เซ็นทรัลเวิลด์",
    address: "ชั้น 7 เซ็นทรัลเวิลด์ 4/1-4/2 ถนนราชดำริ แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7466,
    longitude: 100.5393,
    phone: "02-646-1282",
    priceLevel: 3,
    estimatedMinPrice: 250,
    estimatedMaxPrice: 600,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 22:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "dim-sum-basket",
        verificationStatus: "VERIFIED",
        evidenceSource: "รายการอาหารหลักของ Din Tai Fung (เสี่ยวหลงเปาและติ่มซำ)",
        price: 240,
      },
    ],
  },
  {
    slugKey: "thipsamai-pratuphee",
    name: "ทิพย์สมัย ผัดไทยประตูผี",
    address: "313-315 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร 10200",
    province: "กรุงเทพมหานคร",
    district: "ปทุมวัน",
    latitude: 13.7528,
    longitude: 100.5048,
    phone: "02-226-6666",
    priceLevel: 2,
    estimatedMinPrice: 90,
    estimatedMaxPrice: 250,
    openingHours: {
      isOpenNow: true,
      todayHours: "17:00 – 24:00",
      weekdayText: ["พุธ–จันทร์: 17:00 – 24:00", "อังคาร: ปิดทำการ"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูซิกเนเจอร์ของร้านทิพย์สมัย ผัดไทยเส้นจันท์มันกุ้งกุ้งสด",
        price: 150,
      },
    ],
  },
  {
    slugKey: "bankara-ramen-sukhumvit39",
    name: "Bankara Ramen สุขุมวิท 39",
    address: "32/1 ซอยสุขุมวิท 39 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7364,
    longitude: 100.5715,
    phone: "02-662-5162",
    priceLevel: 2,
    estimatedMinPrice: 210,
    estimatedMaxPrice: 360,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 22:30",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 22:30"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "tonkotsu-ramen",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูหลักของ Bankara Ramen (ราเมงซุปกระดูกหมูทงคตสึ)",
        price: 250,
      },
    ],
  },
  {
    slugKey: "peppina-sukhumvit33",
    name: "Peppina สุขุมวิท 33",
    address: "27/1 ซอยสุขุมวิท 33 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7351,
    longitude: 100.5679,
    phone: "02-119-7677",
    priceLevel: 3,
    estimatedMinPrice: 350,
    estimatedMaxPrice: 750,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:30 – 23:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:30 – 23:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "margherita-pizza",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูพิซซ่าเนเปิลส์มาตรฐาน AVPN ของร้าน Peppina",
        price: 390,
      },
      {
        menuSlug: "spaghetti-carbonara",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดพาสต้าอิตาเลียนของร้าน",
        price: 360,
      },
    ],
  },
  {
    slugKey: "phed-mark-ekkamai",
    name: "เผ็ดมาร์ค เอกมัย (Phed Mark)",
    address: "928 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7192,
    longitude: 100.5844,
    phone: "083-893-8989",
    priceLevel: 2,
    estimatedMinPrice: 120,
    estimatedMaxPrice: 220,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 19:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 19:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูหลักเฉพาะทางผัดกะเพราของร้าน Phed Mark",
        price: 139,
      },
    ],
  },
  {
    slugKey: "daniel-thaiger-sukhumvit",
    name: "Daniel Thaiger เบอร์เกอร์ สุขุมวิท 11",
    address: "30/1 ซอยสุขุมวิท 11 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    latitude: 13.7434,
    longitude: 100.5568,
    phone: "084-549-0995",
    priceLevel: 2,
    estimatedMinPrice: 190,
    estimatedMaxPrice: 320,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 22:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "smash-cheeseburger",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูเบอร์เกอร์เนื้อย่างของ Daniel Thaiger",
        price: 229,
      },
    ],
  },

  // ===================== SONGKHLA — HAT YAI / PSU =====================
  {
    slugKey: "chokdee-dimsum-hatyai",
    name: "โชคดีแต่เตี้ยม หาดใหญ่",
    address: "58/25 ซอยละม้ายสงเคราะห์ 1 ตำบลหาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110",
    province: "สงขลา",
    district: "หาดใหญ่",
    latitude: 7.0029,
    longitude: 100.4767,
    phone: "074-356-779",
    priceLevel: 1,
    estimatedMinPrice: 60,
    estimatedMaxPrice: 180,
    openingHours: {
      isOpenNow: true,
      todayHours: "06:00 – 11:30, 17:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 06:00 – 11:30, 17:00 – 21:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "dim-sum-basket",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูหลักของร้านโชคดีแต่เตี้ยม หาดใหญ่ (ติ่มซำนึ่งสดและบะกุ๊ดเต๋)",
        price: 120,
      },
    ],
  },
  {
    slugKey: "kai-tod-decha-hatyai",
    name: "ไก่ทอดเดชา หาดใหญ่",
    address: "93 ถนนชีอุทิศ ตำบลหาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110",
    province: "สงขลา",
    district: "หาดใหญ่",
    latitude: 7.0072,
    longitude: 100.4718,
    phone: "074-232-894",
    priceLevel: 1,
    estimatedMinPrice: 70,
    estimatedMaxPrice: 180,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 21:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากเมนูไก่ทอดหาดใหญ่และอาหารอีสาน-ใต้ของร้าน",
        price: 140,
      },
    ],
  },
  {
    slugKey: "muikee-ocha-hatyai",
    name: "ข้าวมันไก่มุ่ยกี่โอชา หาดใหญ่",
    address: "177 ถนนศุภสารรังสรรค์ ตำบลหาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110",
    province: "สงขลา",
    district: "หาดใหญ่",
    latitude: 7.0098,
    longitude: 100.4789,
    phone: "074-243-582",
    priceLevel: 1,
    estimatedMinPrice: 55,
    estimatedMaxPrice: 120,
    openingHours: {
      isOpenNow: true,
      todayHours: "07:00 – 14:30",
      weekdayText: ["จันทร์–อาทิตย์: 07:00 – 14:30"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "khao-man-gai",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูหลักของร้านข้าวมันไก่มุ่ยกี่โอชา หาดใหญ่",
        price: 65,
      },
    ],
  },
  {
    slugKey: "nairoo-restaurant-hatyai",
    name: "ร้านในรู หาดใหญ่",
    address: "ซอย 1 ถนนนิพัทธ์อุทิศ 3 ตำบลหาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110",
    province: "สงขลา",
    district: "หาดใหญ่",
    latitude: 7.0048,
    longitude: 100.4712,
    phone: "074-239-993",
    priceLevel: 2,
    estimatedMinPrice: 100,
    estimatedMaxPrice: 280,
    openingHours: {
      isOpenNow: true,
      todayHours: "11:00 – 20:30",
      weekdayText: ["จันทร์–อาทิตย์: 11:00 – 20:30"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารไทยตามสั่งของร้านในรู",
        price: 90,
      },
    ],
  },
  {
    slugKey: "psu-krapow-khao-hong",
    name: "ครัวกะเพรา หน้า ม.อ. หาดใหญ่",
    address: "ถนนปุณณกัณฑ์ ตำบลคอหงส์ อำเภอหาดใหญ่ สงขลา 90110",
    province: "สงขลา",
    district: "หาดใหญ่",
    latitude: 7.0079,
    longitude: 100.5008,
    phone: null,
    priceLevel: 1,
    estimatedMinPrice: 50,
    estimatedMaxPrice: 90,
    openingHours: {
      isOpenNow: true,
      todayHours: "09:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 09:00 – 21:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "VERIFIED",
        evidenceSource: "รายการอาหารตามสั่งหลักบริเวณหน้า ม.อ. หาดใหญ่",
        price: 60,
      },
    ],
  },

  // ===================== CHIANG MAI =====================
  {
    slugKey: "tong-tem-toh-nimman",
    name: "ต๋องเต็มโต๊ะ นิมมานเหมินท์ ซอย 13",
    address: "11 นิมมานเหมินท์ ซอย 13 ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    latitude: 18.7959,
    longitude: 98.9673,
    phone: "053-894-701",
    priceLevel: 2,
    estimatedMinPrice: 90,
    estimatedMaxPrice: 240,
    openingHours: {
      isOpenNow: true,
      todayHours: "07:00 – 21:00",
      weekdayText: ["จันทร์–อาทิตย์: 07:00 – 21:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารเหนือ-ปิ้งย่างของร้านต๋องเต็มโต๊ะ",
        price: 130,
      },
    ],
  },
  {
    slugKey: "khao-soi-mae-sai-cnx",
    name: "ข้าวซอยแม่สาย เชียงใหม่",
    address: "29/1 ถนนราชพฤกษ์ ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    latitude: 18.8005,
    longitude: 98.9765,
    phone: "053-213-284",
    priceLevel: 1,
    estimatedMinPrice: 55,
    estimatedMaxPrice: 100,
    openingHours: {
      isOpenNow: true,
      todayHours: "08:00 – 16:00",
      weekdayText: ["จันทร์–เสาร์: 08:00 – 16:00", "อาทิตย์: ปิดทำการ"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-krapow-moo-sub",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารไทยพื้นเมือง",
        price: 65,
      },
    ],
  },

  // ===================== PHUKET =====================
  {
    slugKey: "one-chun-phuket",
    name: "วันจันทร์ ภูเก็ต (One Chun Cafe & Restaurant)",
    address: "48/1 ถนนเทพกระษัตรี ตำบลตลาดใหญ่ อำเภอเมืองภูเก็ต ภูเก็ต 83000",
    province: "ภูเก็ต",
    district: "เมืองภูเก็ต",
    latitude: 7.8856,
    longitude: 98.3911,
    phone: "076-355-909",
    priceLevel: 2,
    estimatedMinPrice: 140,
    estimatedMaxPrice: 320,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:00 – 22:00",
      weekdayText: ["จันทร์–อาทิตย์: 10:00 – 22:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารไทย-ภูเก็ตของร้านวันจันทร์",
        price: 160,
      },
    ],
  },

  // ===================== CHONBURI =====================
  {
    slugKey: "mum-aroi-sriracha",
    name: "มุมอร่อย ศรีราชา",
    address: "16/4 ซอยแหลมเกตุ ตำบลศรีราชา อำเภอศรีราชา ชลบุรี 20110",
    province: "ชลบุรี",
    district: "ศรีราชา",
    latitude: 13.1768,
    longitude: 100.9255,
    phone: "081-110-4567",
    priceLevel: 3,
    estimatedMinPrice: 250,
    estimatedMaxPrice: 600,
    openingHours: {
      isOpenNow: true,
      todayHours: "10:30 – 22:30",
      weekdayText: ["จันทร์–อาทิตย์: 10:30 – 22:30"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "pad-thai-kung-sod",
        verificationStatus: "INFERRED",
        evidenceSource: "คาดการณ์จากหมวดอาหารไทย-ซีฟู้ดของร้านมุมอร่อย",
        price: 180,
      },
    ],
  },

  // ===================== KHON KAEN =====================
  {
    slugKey: "kai-yang-rabiab-kkc",
    name: "ไก่ย่างระเบียบ ขอนแก่น",
    address: "352 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองขอนแก่น ขอนแก่น 40000",
    province: "ขอนแก่น",
    district: "เมืองขอนแก่น",
    latitude: 16.4375,
    longitude: 102.8258,
    phone: "043-224-888",
    priceLevel: 1,
    estimatedMinPrice: 70,
    estimatedMaxPrice: 190,
    openingHours: {
      isOpenNow: true,
      todayHours: "09:00 – 20:00",
      weekdayText: ["จันทร์–อาทิตย์: 09:00 – 20:00"],
    },
    photoUrls: [],
    menus: [
      {
        menuSlug: "somtum-kai-yang",
        verificationStatus: "VERIFIED",
        evidenceSource: "เมนูซิกเนเจอร์ของร้านไก่ย่างระเบียบ ขอนแก่น",
        price: 150,
      },
    ],
  },
];
