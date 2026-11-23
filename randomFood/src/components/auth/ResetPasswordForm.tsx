"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    async function validate() {
      if (!token) {
        setTokenValid(false);
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (active && res.ok && json.success) {
          setTokenValid(Boolean(json.data?.valid));
          setEmailMasked(json.data?.emailMasked ?? null);
        }
      } catch {
        if (active) setTokenValid(false);
      } finally {
        if (active) setChecking(false);
      }
    }
    validate();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้"
        );
      }

      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <LoadingState className="mt-6" message="กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน..." />;
  }

  if (done) {
    return (
      <div className="mt-6 rounded-3xl border border-emerald-200 bg-surface p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-stone-900">
          ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว
        </h2>
        <p className="mt-1.5 text-xs text-stone-500">
          คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
        </p>
        <Link
          href="/auth/login"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <EmptyState
        className="mt-6"
        title="ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว"
        description="ลิงก์รีเซ็ตรหัสผ่านใช้งานได้เพียงครั้งเดียวและมีอายุ 30 นาที กรุณาขอลิงก์ใหม่อีกครั้ง"
        action={
          <Link
            href="/auth/forgot-password"
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            ขอลิงก์รีเซ็ตรหัสผ่านใหม่
          </Link>
        }
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-3xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8"
    >
      {emailMasked && (
        <p className="rounded-xl bg-surface-muted/70 px-3.5 py-2 text-xs text-stone-600">
          กำลังตั้งรหัสผ่านใหม่สำหรับบัญชี:{" "}
          <strong className="text-stone-900">{emailMasked}</strong>
        </p>
      )}

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
          htmlFor="reset-new-password"
          className="block text-xs font-semibold text-stone-700"
        >
          รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
        </label>
        <PasswordInput
          id="reset-new-password"
          value={newPassword}
          onChange={setNewPassword}
          minLength={8}
          autoComplete="new-password"
          placeholder="กรอกรหัสผ่านใหม่"
          className="mt-1.5"
        />
      </div>

      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-xs font-semibold text-stone-700"
        >
          ยืนยันรหัสผ่านใหม่
        </label>
        <PasswordInput
          id="reset-confirm-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={8}
          autoComplete="new-password"
          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          className="mt-1.5"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {submitting ? "กำลังบันทึกรหัสผ่านใหม่..." : "ยืนยันตั้งรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
