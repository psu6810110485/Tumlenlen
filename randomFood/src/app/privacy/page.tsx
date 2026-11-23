import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับหน้าแรก
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            นโยบายความเป็นส่วนตัว (PDPA Privacy Notice)
          </h1>
          <p className="text-xs text-stone-500">
            Food Roulette — Smart Food Discovery Platform
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5 rounded-3xl border border-border-subtle bg-surface p-6 text-sm leading-relaxed text-stone-700 shadow-sm sm:p-8">
        <section>
          <h2 className="text-base font-bold text-stone-900">
            1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>ข้อมูลบัญชีสมาชิก: อีเมล, ชื่อที่แสดง และรหัสผ่านแบบเข้ารหัส (scrypt salted hash)</li>
            <li>ข้อมูลการใช้งานในระบบ: รีวิวบนเว็บไซต์, ร้านอาหารโปรด และประวัติการสุ่มเมนูอาหาร</li>
            <li>พิกัดตำแหน่ง (GPS): ใช้เฉพาะเมื่อผู้ใช้กดอนุญาตเพื่อคำนวณระยะทางไปยังร้านอาหารใกล้เคียงเท่านั้น</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-stone-900">
            2. ความโปร่งใสของแหล่งข้อมูลร้านอาหารและรีวิว
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>รีวิวจากสมาชิก Food Roulette จะถูกแสดงแยกจากคะแนนและรีวิวของ Google Places อย่างชัดเจน</li>
            <li>ข้อมูลการยืนยันเมนูแยกสถานะ VERIFIED และ INFERRED อย่างโปร่งใส</li>
            <li>ลิงก์สั่งอาหาร (GrabFood / LINE MAN) จะใช้ URL ร้านโดยตรงเฉพาะที่ยืนยันแล้ว มิฉะนั้นจะเปิดหน้าค้นหาด้วยชื่อร้านแทน</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-stone-900">
            3. สิทธิของเจ้าของข้อมูล (PDPA Rights)
          </h2>
          <p className="mt-2 text-xs sm:text-sm">
            สมาชิกสามารถตรวจสอบข้อมูลของตนเอง ลบรีวิว ลบร้านโปรด หรือใช้สิทธิในการลบข้อมูลถาวร
            (Right to Erasure) เพื่อลบบัญชีและข้อมูลที่เกี่ยวข้องทั้งหมดได้ทันทีที่หน้า{" "}
            <Link href="/profile" className="font-semibold text-orange-600 hover:underline">
              โปรไฟล์ของคุณ
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
