import Link from "next/link";
import { getRestaurantDetail } from "@/server/services/restaurant-detail-service";
import { RestaurantDetailClient } from "@/components/restaurants/RestaurantDetailClient";
import { EmptyState } from "@/components/ui/StateViews";

interface RestaurantDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: RestaurantDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const latRaw = typeof query.lat === "string" ? Number(query.lat) : Number.NaN;
  const lngRaw = typeof query.lng === "string" ? Number(query.lng) : Number.NaN;
  const menuSlug =
    typeof query.menuSlug === "string" ? query.menuSlug : undefined;

  const userLat = Number.isFinite(latRaw) ? latRaw : undefined;
  const userLng = Number.isFinite(lngRaw) ? lngRaw : undefined;

  const restaurant = await getRestaurantDetail(id, {
    userLat,
    userLng,
    highlightMenuSlug: menuSlug,
  });

  const backParams = new URLSearchParams();
  if (userLat !== undefined && userLng !== undefined) {
    backParams.set("lat", String(userLat));
    backParams.set("lng", String(userLng));
  }
  if (menuSlug) backParams.set("menuSlug", menuSlug);
  const backHref =
    backParams.toString().length > 0
      ? `/restaurants?${backParams.toString()}`
      : "/restaurants";

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="ไม่พบข้อมูลร้านอาหารนี้"
          description="ร้านอาหารอาจถูกลบออกจากระบบ หรือรหัสร้านไม่ตรงกับข้อมูลในโหมดปัจจุบัน"
          action={
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              กลับไปค้นหาร้านอาหาร
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <RestaurantDetailClient
      restaurant={restaurant}
      backHref={backHref}
      highlightMenuSlug={menuSlug}
    />
  );
}
