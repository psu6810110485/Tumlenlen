"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck, User, UserPlus } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!pdpaAccepted) {
      setError("กรุณายอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนสมัครสมาชิก");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          pdpaAccepted: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "ไม่สามารถสมัครสมาชิกได้");
      }

      window.dispatchEvent(new Event("fr-auth-changed"));
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก"
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
          htmlFor="register-name"
          className="block text-xs font-semibold text-stone-700"
        >
          ชื่อที่แสดง
        </label>
        <div className="relative mt-1.5">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="register-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="เช่น พิมพ์ชนก"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="block text-xs font-semibold text-stone-700"
        >
          อีเมล
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="register-email"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-stone-700"
          >
            รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-semibold text-stone-700"
          >
            ยืนยันรหัสผ่าน
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* PDPA Consent Box */}
      <div className="rounded-2xl border border-border-subtle bg-surface-muted/60 p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-stone-700">
          <input
            type="checkbox"
            checked={pdpaAccepted}
            onChange={(e) => setPdpaAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-orange-600"
          />
          <span>
            <strong className="inline-flex items-center gap-1 text-stone-900">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
              ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA):
            </strong>{" "}
            ข้าพเจ้ายินยอมให้ Food Roulette จัดเก็บอีเมล ชื่อที่แสดง รีวิว ร้านโปรด และประวัติการสุ่มอาหารเพื่อการให้บริการ โดยสามารถขอลบบัญชีและข้อมูลทั้งหมดได้ทุกเมื่อที่หน้าโปรไฟล์
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
      </button>

      <p className="pt-2 text-center text-xs text-stone-500">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-orange-600 hover:underline"
        >
          เข้าสู่ระบบที่นี่
        </Link>
      </p>
    </form>
  );
}
