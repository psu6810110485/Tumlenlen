import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        ตั้งรหัสผ่านใหม่
      </h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        กรอกรหัสผ่านใหม่ที่ต้องการใช้งานสำหรับบัญชี Food Roulette ของคุณ
      </p>

      <ResetPasswordForm token={token} />
    </div>
  );
}
