import Link from "next/link";
import { EmptyState } from "@/components/ui/StateViews";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">สมัครสมาชิก</h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        สร้างบัญชี Food Roulette เพื่อจัดการร้านโปรดและรีวิวร้านอาหาร
      </p>

      <EmptyState
        className="mt-6"
        title="ระบบสมัครสมาชิกจะเปิดใช้งานใน Phase 5"
        description="รองรับ POST /api/v1/auth/register พร้อมการยืนยันความยินยอม PDPA และตรวจสอบข้อมูลด้วย Zod"
        action={
          <div className="flex gap-2">
            <Link
              href="/auth/login"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
            <Link
              href="/"
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              กลับหน้าแรก
            </Link>
          </div>
        }
      />
    </div>
  );
}
