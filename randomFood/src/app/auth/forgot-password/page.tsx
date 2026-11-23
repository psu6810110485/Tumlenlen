import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        ลืมรหัสผ่าน
      </h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่ผ่าน Gmail (ใช้งานได้ 30 นาที)
      </p>

      <ForgotPasswordForm />
    </div>
  );
}
