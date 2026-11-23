import Link from "next/link";
import { EmptyState } from "@/components/ui/StateViews";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">เข้าสู่ระบบ</h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        เข้าสู่ระบบเพื่อเขียนรีวิว บันทึกร้านโปรด และดูประวัติการสุ่มอาหาร
      </p>

      <EmptyState
        className="mt-6"
        title="ระบบสมาชิกจะเปิดใช้งานใน Phase 5"
        description="รองรับ POST /api/v1/auth/login, Password Hashing, HttpOnly Cookie Session และ Rate Limiting"
        action={
          <div className="flex gap-2">
            <Link
              href="/auth/register"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              หน้าสมัครสมาชิก
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
