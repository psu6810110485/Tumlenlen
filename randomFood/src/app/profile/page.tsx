import Link from "next/link";
import { EmptyState } from "@/components/ui/StateViews";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">โปรไฟล์ ร้านโปรด & ประวัติการสุ่ม</h1>
      <p className="mt-1 text-sm text-stone-500">
        จัดการข้อมูลส่วนตัว ร้านอาหารที่บันทึกไว้ และประวัติเมนูที่เคยสุ่ม
      </p>

      <EmptyState
        className="mt-8"
        title="พร้อมพัฒนาใน Phase 5"
        description="ตาราง users, favorites และ random_history ถูกออกแบบไว้ใน Prisma Schema เรียบร้อยแล้ว"
        action={
          <Link
            href="/"
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            กลับหน้าแรก
          </Link>
        }
      />
    </div>
  );
}
