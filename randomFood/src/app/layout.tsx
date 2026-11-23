import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ModeBanner } from "@/components/ui/ModeBanner";

export const metadata: Metadata = {
  title: "Food Roulette — วันนี้กินอะไรดี?",
  description:
    "แพลตฟอร์มสุ่มเมนูอาหารอัจฉริยะ พร้อมค้นหาร้านอาหารจริงใกล้คุณ รีวิว แผนที่ และลิงก์สั่งอาหาร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ModeBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
