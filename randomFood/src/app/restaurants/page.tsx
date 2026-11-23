import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/StateViews";

export default function RestaurantsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <Compass className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">ค้นหาร้านอาหารใกล้คุณ</h1>
          <p className="text-sm text-stone-500">
            List View & Map View พร้อมตัวกรองคะแนน ระยะทาง และราคา
          </p>
        </div>
      </div>

      <EmptyState
        className="mt-8"
        title="พร้อมพัฒนาใน Phase 3 & Phase 4"
        description="หน้านี้จะเชื่อมต่อกับ PostGIS Spatial Search, Google Places Adapter (Live/Mock) และ Restaurant Matching Algorithm เพื่อแสดงร้านที่ขายเมนูที่สุ่มได้จริง"
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            ไปหน้าสุ่มอาหาร
          </Link>
        }
      />
    </div>
  );
}
