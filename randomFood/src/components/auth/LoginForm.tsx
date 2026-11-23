"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Mail } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/profile" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "ไม่สามารถเข้าสู่ระบบได้");
      }

      window.dispatchEvent(new Event("fr-auth-changed"));
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-3xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8"
    >
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold text-stone-700"
        >
          อีเมล
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-stone-700"
          >
            รหัสผ่าน
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="กรอกรหัสผ่านของคุณ"
          className="mt-1.5"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      <p className="pt-2 text-center text-xs text-stone-500">
        ยังไม่มีบัญชีผู้ใช้?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-orange-600 hover:underline"
        >
          สมัครสมาชิกที่นี่
        </Link>
      </p>
    </form>
  );
}
