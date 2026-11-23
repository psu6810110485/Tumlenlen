import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">Food Roulette</p>
            <p className="mt-1 text-xs text-stone-500">
              แพลตฟอร์มช่วยตัดสินใจมื้ออาหารและค้นหาร้านอาหารใกล้คุณอย่างโปร่งใส
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
            <Link href="/" className="hover:text-orange-600">
              หน้าแรก
            </Link>
            <Link href="/restaurants" className="hover:text-orange-600">
              ค้นหาร้านอาหาร
            </Link>
            <Link href="/profile" className="hover:text-orange-600">
              โปรไฟล์
            </Link>
            <Link href="/privacy" className="hover:text-orange-600">
              นโยบาย PDPA
            </Link>
            <Link href="/api/v1/health" className="hover:text-orange-600">
              API Health
            </Link>
          </div>
        </div>
        <p className="mt-6 border-t border-border-subtle pt-4 text-[11px] text-stone-400">
          © {new Date().getFullYear()} Food Roulette. ข้อมูลร้านอาหารและรีวิวจากภายนอกจะแสดงแหล่งที่มาอย่างชัดเจนตามข้อกำหนดของผู้ให้บริการ
        </p>
      </div>
    </footer>
  );
}
