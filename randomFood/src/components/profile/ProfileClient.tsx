"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Heart,
  History,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import type { UserProfileDTO } from "@/server/services/auth-service";
import type { FavoriteDTO } from "@/server/services/favorite-service";
import type { RandomHistoryDTO } from "@/server/services/history-service";
import type { WebReviewDTO } from "@/server/services/review-service";

export function ProfileClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
  const [reviews, setReviews] = useState<WebReviewDTO[]>([]);
  const [history, setHistory] = useState<RandomHistoryDTO[]>([]);
  const [activeTab, setActiveTab] = useState<"favorites" | "reviews" | "history">(
    "favorites"
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
      const meJson = await meRes.json();
      const authUser: UserProfileDTO | null = meJson.data?.user ?? null;
      setUser(authUser);

      if (!authUser) {
        setLoading(false);
        return;
      }

      const [favRes, revRes, histRes] = await Promise.all([
        fetch("/api/v1/favorites", { cache: "no-store" }),
        fetch("/api/v1/reviews?mine=true", { cache: "no-store" }),
        fetch("/api/v1/history", { cache: "no-store" }),
      ]);

      const [favJson, revJson, histJson] = await Promise.all([
        favRes.json(),
        revRes.json(),
        histRes.json(),
      ]);

      setFavorites(favJson.data?.favorites ?? []);
      setReviews(revJson.data?.reviews ?? []);
      setHistory(histJson.data?.history ?? []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ในขณะนี้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleRemoveFavorite(restaurantId: string) {
    const res = await fetch("/api/v1/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId }),
    });
    if (res.ok) {
      setFavorites((prev) => prev.filter((f) => f.restaurantId !== restaurantId));
    }
  }

  async function handleDeleteReview(reviewId: string) {
    const res = await fetch(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("fr-auth-changed"));
    setUser(null);
    router.refresh();
  }

  async function handleDeleteAccount() {
    const res = await fetch("/api/v1/auth/me", { method: "DELETE" });
    if (res.ok) {
      window.dispatchEvent(new Event("fr-auth-changed"));
      setUser(null);
      setConfirmDelete(false);
      router.push("/");
      router.refresh();
    }
  }

  if (loading) {
    return <LoadingState className="mt-8" message="กำลังโหลดข้อมูลโปรไฟล์ของคุณ..." />;
  }

  if (error) {
    return <ErrorState className="mt-8" message={error} onRetry={loadAll} />;
  }

  if (!user) {
    return (
      <EmptyState
        className="mt-8"
        title="กรุณาเข้าสู่ระบบเพื่อดูร้านโปรด รีวิว และประวัติการสุ่ม"
        description="สมัครสมาชิกหรือเข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัว บันทึกร้านโปรด และเขียนรีวิวร้านอาหาร"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full border border-stone-300 bg-surface px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              สมัครสมาชิก
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* User Summary Card */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <User className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{user.displayName}</h2>
            <p className="text-xs text-stone-500">{user.email}</p>
            {user.pdpaConsentAt && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                ยืนยันความยินยอม PDPA แล้ว
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </button>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
        {[
          {
            id: "favorites" as const,
            label: `ร้านโปรด (${favorites.length})`,
            icon: Heart,
          },
          {
            id: "reviews" as const,
            label: `รีวิวของฉัน (${reviews.length})`,
            icon: MessageSquare,
          },
          {
            id: "history" as const,
            label: `ประวัติการสุ่ม (${history.length})`,
            icon: History,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-orange-600 text-white"
                  : "bg-surface text-stone-600 hover:bg-stone-100"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "favorites" && (
        <section>
          {favorites.length === 0 ? (
            <EmptyState
              title="ยังไม่มีร้านโปรดที่บันทึกไว้"
              description="กดปุ่ม บันทึกร้านโปรด ในหน้ารายละเอียดร้านอาหาร เพื่อเก็บไว้ดูภายหลัง"
              action={
                <Link
                  href="/restaurants"
                  className="rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  ไปค้นหาร้านอาหาร
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/restaurants/${encodeURIComponent(fav.restaurantId)}`}
                      className="block truncate text-sm font-bold text-stone-900 hover:text-orange-600"
                    >
                      {fav.restaurantName}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                      {fav.restaurantAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(fav.restaurantId)}
                    aria-label="นำออกจากร้านโปรด"
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section>
          {reviews.length === 0 ? (
            <EmptyState
              title="คุณยังไม่ได้เขียนรีวิวร้านอาหาร"
              description="แบ่งปันความคิดเห็นของคุณในหน้ารายละเอียดร้านอาหารเพื่อช่วยผู้ใช้คนอื่นตัดสินใจ"
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-border-subtle bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/restaurants/${encodeURIComponent(rev.restaurantId)}`}
                      className="text-sm font-bold text-stone-900 hover:text-orange-600"
                    >
                      {rev.restaurantName}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                        <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                        {rev.rating}.0
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        ลบรีวิว
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-700">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "history" && (
        <section>
          {history.length === 0 ? (
            <EmptyState
              title="ยังไม่มีประวัติการสุ่มอาหาร"
              description="ลองไปสุ่มอาหารในขณะที่เข้าสู่ระบบ เพื่อให้ระบบบันทึกประวัติเมนูที่คุณสุ่มไว้ที่นี่"
              action={
                <Link
                  href="/random"
                  className="rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  ไปสุ่มอาหารเลย
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <CategoryIcon slug={item.categorySlug} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900">
                        {item.menuNameTh}
                      </p>
                      <p className="text-xs text-stone-500">
                        ฿{item.minPrice}–฿{item.maxPrice}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/restaurants?menuSlug=${encodeURIComponent(item.menuSlug)}&menuName=${encodeURIComponent(item.menuNameTh)}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-border-subtle px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-700"
                  >
                    หาร้านใกล้ฉัน
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PDPA Right to Erasure Section */}
      <section className="rounded-3xl border border-red-200/80 bg-red-50/40 p-5">
        <h3 className="text-sm font-bold text-red-900">
          สิทธิในการลบข้อมูลส่วนบุคคล (PDPA — Right to Erasure)
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-red-800/80">
          คุณสามารถลบบัญชีผู้ใช้ รีวิว ร้านโปรด และประวัติการสุ่มทั้งหมดออกจากระบบอย่างถาวรได้ทุกเมื่อ
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            ขอลบบัญชีและข้อมูลทั้งหมด
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              ยืนยันการลบบัญชีถาวร
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
