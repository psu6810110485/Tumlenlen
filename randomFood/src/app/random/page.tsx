import { RandomizerClient } from "@/components/random/RandomizerClient";

interface RandomPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RandomResultPage({ searchParams }: RandomPageProps) {
  const params = await searchParams;

  const rawCategories =
    typeof params.categories === "string" ? params.categories : "";
  const initialCategories = rawCategories
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initialBudget =
    typeof params.budget === "string" ? params.budget : "ANY";
  const initialMealType =
    typeof params.mealType === "string" ? params.mealType : "ANY";
  const radiusKm =
    typeof params.radiusKm === "string" ? params.radiusKm : "5";
  const lat = typeof params.lat === "string" ? params.lat : undefined;
  const lng = typeof params.lng === "string" ? params.lng : undefined;
  const area = typeof params.area === "string" ? params.area : undefined;

  return (
    <RandomizerClient
      initialCategories={initialCategories}
      initialBudget={initialBudget}
      initialMealType={initialMealType}
      radiusKm={radiusKm}
      lat={lat}
      lng={lng}
      area={area}
    />
  );
}
