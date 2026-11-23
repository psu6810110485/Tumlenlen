import { ProfileClient } from "@/components/profile/ProfileClient";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">
        โปรไฟล์ ร้านโปรด &amp; ประวัติการสุ่ม
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        จัดการบัญชีผู้ใช้ ร้านอาหารที่บันทึกไว้ รีวิวของคุณ และประวัติเมนูที่เคยสุ่ม
      </p>

      <ProfileClient />
    </div>
  );
}
