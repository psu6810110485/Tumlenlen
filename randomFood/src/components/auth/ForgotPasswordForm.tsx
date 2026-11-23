"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Mail,
  Send,
} from "lucide-react";

interface ForgotResponse {
  success: boolean;
  data?: {
    message: string;
    deliveryMode: "gmail-smtp" | "sandbox-preview" | "skipped";
    previewResetUrl?: string;
  };
  error?: {
    message?: string;
  };
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmittedMessage(null);
    setPreviewResetUrl(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json: ForgotResponse = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(
          json.error?.message || "ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้"
        );
      }

      setSubmittedMessage(json.data.message);
      setDeliveryMode(json.data.deliveryMode);
      setPreviewResetUrl(json.data.previewResetUrl ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบส่งอีเมล"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8">
      {submittedMessage ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">ส่งคำขอเรียบร้อยแล้ว</p>
              <p className="mt-1">{submittedMessage}</p>
            </div>
          </div>

          {deliveryMode === "sandbox-preview" && previewResetUrl && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              <p className="flex items-center gap-1.5 font-bold">
                <FlaskConical className="h-4 w-4 text-amber-600" />
                โหมดทดสอบอีเมล (ยังไม่ได้ตั้งค่า GMAIL_USER / GMAIL_APP_PASSWORD)
              </p>
              <p className="mt-1 leading-relaxed text-amber-900">
                สามารถคลิกลิงก์ทดสอบด้านล่างเพื่อรีเซ็ตรหัสผ่านได้ทันที หรือใส่{" "}
                <code className="rounded bg-white px-1 py-0.5">GMAIL_USER</code>{" "}
                และ{" "}
                <code className="rounded bg-white px-1 py-0.5">
                  GMAIL_APP_PASSWORD
                </code>{" "}
                ในไฟล์ <code className="rounded bg-white px-1 py-0.5">.env</code>{" "}
                เพื่อส่งเข้า Gmail จริง:
              </p>
              <Link
                href={previewResetUrl}
                className="mt-2.5 inline-block break-all rounded-xl bg-white px-3 py-2 font-semibold text-orange-700 underline hover:bg-orange-50"
              >
                {previewResetUrl}
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSubmittedMessage(null);
                setPreviewResetUrl(null);
              }}
              className="font-semibold text-stone-600 hover:text-orange-600"
            >
              ส่งอีเมลอีกครั้ง
            </button>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              กลับหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              htmlFor="forgot-email"
              className="block text-xs font-semibold text-stone-700"
            >
              อีเมลที่ใช้สมัครสมาชิก (Gmail หรืออีเมลอื่น)
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "กำลังส่งลิงก์รีเซ็ตรหัสผ่าน..." : "ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล"}
          </button>

          <p className="pt-2 text-center text-xs text-stone-500">
            จำรหัสผ่านได้แล้ว?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-orange-600 hover:underline"
            >
              กลับไปเข้าสู่ระบบ
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
