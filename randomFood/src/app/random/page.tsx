import Link from "next/link";
import { ArrowLeft, Dices } from "lucide-react";
import { EmptyState } from "@/components/ui/StateViews";

interface RandomPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RandomResultPage({ searchParams }: RandomPageProps) {
  const params = await searchParams;
  const categories = typeof params.categories === "string" ? params.categories : "ทุกหมวดหมู่";
  const budget = typeof params.budget === "string" ? params.budget : "ANY";
  const mealType = typeof params.mealType === "string" ? params.mealType : "ANY";
  const radiusKm = typeof params.radiusKm === "string" ? params.radiusKm : "5";
  const area = typeof params.area === "string" ? params.area : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปเลือกเงื่อนไขใหม่
      </Link>

      <div className="mt-6 rounded-3xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Dices className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-stone-900">ผลลัพธ์การสุ่มอาหาร</h1>
            <p className="text-xs text-stone-500">Phase 2: Food Randomizer Engine</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-stone-700">
            หมวดหมู่: {categories}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-stone-700">
            งบประมาณ: {budget}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-stone-700">
            มื้อ: {mealType}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-stone-700">
            รัศมี: {radiusKm} กม.
          </span>
          {area && (
            <span className="rounded-full bg-surface-muted px-3 py-1 text-stone-700">
              พื้นที่: {area}
            </span>
          )}
        </div>

        <EmptyState
          className="mt-6"
          title="พร้อมเชื่อมต่อระบบสุ่มเมนูใน Phase 2"
          description="โครงสร้างฐานข้อมูลและพารามิเตอร์ตัวกรองพร้อมใช้งานแล้ว ขั้นตอนถัดไป (Phase 2) จะเพิ่มฐานข้อมูลเมนูอาหาร, API POST /api/v1/menus/random, Animation สุ่มอาหาร และระบบกันสุ่มซ้ำ"
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              กลับหน้าแรก
            </Link>
          }
        />
      </div>
    </div>
  );
}
