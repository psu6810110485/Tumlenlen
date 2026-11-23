"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Database, Globe, RefreshCw, ShieldAlert } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

interface HealthResponse {
  success: boolean;
  data?: {
    service: string;
    phase: number;
    status: "healthy" | "degraded";
    database: {
      status: "connected" | "disconnected";
      postgisVersion: string | null;
      note?: string;
    };
    externalApis: {
      configuredMode: "mock" | "live";
      effectiveMode: "mock" | "live";
      googlePlacesConfigured: boolean;
    };
  };
}

export function SystemStatusCard() {
  const [health, setHealth] = useState<HealthResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: HealthResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error("รูปแบบข้อมูล Health API ไม่ถูกต้อง");
      }
      setHealth(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อ API ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  if (loading) {
    return <LoadingState message="กำลังตรวจสอบสถานะระบบและฐานข้อมูล..." className="py-6" />;
  }

  if (error || !health) {
    return (
      <ErrorState
        title="ไม่สามารถตรวจสอบสถานะ API ได้"
        message={error ?? "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
        onRetry={loadHealth}
        className="py-6"
      />
    );
  }

  const dbConnected = health.database.status === "connected";

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {dbConnected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          )}
          <h2 className="text-sm font-semibold text-stone-900">
            สถานะระบบ (Phase {health.phase} Foundation)
          </h2>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
        >
          <RefreshCw className="h-3 w-3" />
          รีเฟรช
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-surface-muted/40 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
            <Database className="h-4 w-4 text-orange-600" />
            PostgreSQL + PostGIS
          </div>
          <p className="mt-1 text-xs text-stone-600">
            สถานะ:{" "}
            <span className={dbConnected ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {dbConnected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ (รัน npm run db:up)"}
            </span>
          </p>
          {health.database.postgisVersion && (
            <p className="mt-0.5 text-[11px] text-stone-500">
              PostGIS: {health.database.postgisVersion}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-muted/40 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
            <Globe className="h-4 w-4 text-orange-600" />
            External API Mode
          </div>
          <p className="mt-1 text-xs text-stone-600">
            โหมดที่ใช้งาน:{" "}
            <span className="font-semibold uppercase text-stone-900">
              {health.externalApis.effectiveMode}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Google Places API Key:{" "}
            {health.externalApis.googlePlacesConfigured ? "ตั้งค่าแล้ว" : "ยังไม่ตั้งค่า"}
          </p>
        </div>
      </div>
    </div>
  );
}
