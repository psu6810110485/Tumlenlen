import { Compass, Dices, ShieldCheck } from "lucide-react";
import { DiscoveryForm } from "@/components/home/DiscoveryForm";
import { SystemStatusCard } from "@/components/home/SystemStatusCard";

const HIGHLIGHTS = [
  {
    icon: Dices,
    title: "1. สุ่มเมนูตามใจคุณ",
    description:
      "เลือกหมวดหมู่ งบประมาณ และมื้ออาหาร พร้อมระบบกันสุ่มเมนูเดิมซ้ำ",
  },
  {
    icon: Compass,
    title: "2. หาร้านใกล้คุณด้วย PostGIS",
    description:
      "รองรับทั้งพิกัด GPS และเลือกจังหวัด/อำเภอเอง คำนวณระยะทางจริงในรัศมี 1–20 กม.",
  },
  {
    icon: ShieldCheck,
    title: "3. ข้อมูลโปร่งใส ตรวจสอบได้",
    description:
      "แยกเมนูที่ยืนยันแล้วออกจากข้อมูลคาดการณ์ แยกรีวิวในเว็บจาก Google Places ชัดเจน",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3.5 py-1 text-xs font-semibold text-orange-800">
          Smart Food Discovery Platform
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          วันนี้กินอะไรดี?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-600 sm:text-base">
          ให้ Food Roulette ช่วยสุ่มเมนูอาหารที่ใช่ แล้วค้นหาร้านอาหารจริงใกล้คุณ
          พร้อมคะแนนรีวิว ระยะทาง แผนที่ และช่องทางสั่งอาหาร
        </p>
      </section>

      {/* Main Discovery Card */}
      <section className="mt-8">
        <DiscoveryForm />
      </section>

      {/* Highlights */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-border-subtle bg-surface p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-stone-900">
                {item.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                {item.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Phase 1 Live Health Verification */}
      <section className="mt-10">
        <SystemStatusCard />
      </section>
    </div>
  );
}
