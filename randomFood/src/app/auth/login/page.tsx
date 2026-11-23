import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextParam =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/profile";

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        เข้าสู่ระบบ
      </h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        เข้าสู่ระบบเพื่อเขียนรีวิว บันทึกร้านโปรด และดูประวัติการสุ่มอาหาร
      </p>

      <LoginForm redirectTo={nextParam} />
    </div>
  );
}
