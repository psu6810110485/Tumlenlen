import { FlaskConical } from "lucide-react";
import { getPublicConfig } from "@/lib/env";

export function ModeBanner() {
  const { externalApiMode } = getPublicConfig();

  if (externalApiMode === "live") {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>
          <strong>Mock / Sandbox Mode:</strong> ยังไม่ได้ตั้งค่า External API Key (Google Places / Maps) — ระบบแยกโหมดทดสอบชัดเจนและไม่แสดงข้อมูลปลอมแทนข้อมูลจริง
        </span>
      </div>
    </div>
  );
}
