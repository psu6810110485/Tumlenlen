/**
 * Curated illustrative dish/category images used transparently when a restaurant
 * has no real storefront photo available yet (always badged "ภาพประกอบเมนู" in UI).
 */

const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80",
  japanese:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
  korean:
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
  chinese:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  italian:
    "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=80",
  "fast-food":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
};

const KEYWORD_ILLUSTRATIONS: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["กะเพรา", "krapow", "ตามสั่ง", "phed mark", "ในรู"],
    url: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["ผัดไทย", "pad thai", "pad-thai", "ทิพย์สมัย"],
    url: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["ส้มตำ", "ไก่ย่าง", "ไก่ทอด", "somtum", "อีสาน", "เดชา", "ระเบียบ"],
    url: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["ข้าวมันไก่", "khao-man-gai", "โกอ่าง", "มุ่ยกี่"],
    url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["ก๋วยเตี๋ยว", "บะหมี่", "ข้าวต้ม", "โจ๊ก", "ราเมง", "ramen", "ข้าวซอย"],
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["แซลมอน", "ซูชิ", "ปลาดิบ", "salmon", "sushi", "ญี่ปุ่น", "อิซากายะ"],
    url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["ติ่มซำ", "แต่เตี้ยม", "dim-sum", "ซาลาเปา", "din tai fung", "ฮะเก๋า"],
    url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["บอนชอน", "bonchon", "เกาหลี", "ต๊อก", "กิมจิ", "korean"],
    url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["พิซซ่า", "พาสต้า", "สปาเกตตี", "pizza", "pasta", "peppina", "carbonara"],
    url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["เบอร์เกอร์", "burger", "thaiger", "สเต็ก", "steak"],
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["คาเฟ่", "กาแฟ", "cafe", "coffee"],
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
  },
];

const DEFAULT_FOOD_ILLUSTRATION =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80";

export function getIllustrativeRestaurantImage(options: {
  restaurantName?: string;
  menuSlug?: string | null;
  categories?: string[];
}): string {
  const hay = `${options.menuSlug ?? ""} ${options.restaurantName ?? ""}`.toLowerCase();

  for (const entry of KEYWORD_ILLUSTRATIONS) {
    if (entry.keywords.some((kw) => hay.includes(kw.toLowerCase()))) {
      return entry.url;
    }
  }

  for (const cat of options.categories ?? []) {
    const match = CATEGORY_ILLUSTRATIONS[cat.toLowerCase()];
    if (match) return match;
  }

  return DEFAULT_FOOD_ILLUSTRATION;
}
