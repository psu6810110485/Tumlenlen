"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Dices,
  Heart,
  LogOut,
  Menu,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "สุ่มอาหาร", icon: Dices },
  { href: "/restaurants", label: "ค้นหาร้านใกล้คุณ", icon: Compass },
  { href: "/profile", label: "ร้านโปรด & ประวัติ", icon: Heart },
];

interface AuthUserSummary {
  id: string;
  email: string;
  displayName: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUserSummary | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setUser(json.data?.user ?? null);
    } catch {
      // Ignore transient errors
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handler = () => loadUser();
    window.addEventListener("fr-auth-changed", handler);
    return () => window.removeEventListener("fr-auth-changed", handler);
  }, [loadUser]);

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    setMobileOpen(false);
    window.dispatchEvent(new Event("fr-auth-changed"));
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm transition-transform group-hover:rotate-6">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-stone-900">
              Food Roulette
            </span>
            <span className="hidden text-[11px] font-medium text-stone-500 sm:block">
              Smart Food Discovery
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-sm font-semibold text-stone-800 hover:border-orange-300"
              >
                <User className="h-4 w-4 text-orange-600" />
                <span className="max-w-[120px] truncate">{user.displayName}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <LogOut className="h-3.5 w-3.5" />
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl p-2 text-stone-700 hover:bg-stone-100 md:hidden"
          aria-label="เปิดเมนู"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="border-t border-border-subtle bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="เมนูมือถือ">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-700 hover:bg-stone-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 flex gap-2 border-t border-border-subtle pt-3">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 py-2 text-sm font-semibold text-stone-800"
                  >
                    <User className="h-4 w-4 text-orange-600" />
                    {user.displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700"
                  >
                    <LogOut className="h-4 w-4" />
                    ออก
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl border border-stone-300 py-2 text-center text-sm font-medium text-stone-700"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl bg-orange-600 py-2 text-center text-sm font-semibold text-white"
                  >
                    สมัครสมาชิก
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
