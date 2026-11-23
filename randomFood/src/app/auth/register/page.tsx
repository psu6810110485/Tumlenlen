import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        สมัครสมาชิก
      </h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        สร้างบัญชี Food Roulette เพื่อบันทึกร้านโปรด ประวัติการสุ่ม และเขียนรีวิวร้านอาหาร
      </p>

      <RegisterForm />
    </div>
  );
}
