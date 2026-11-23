import {
  Flame,
  Fish,
  Pizza,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface CategoryIconProps {
  slug?: string;
  iconKey?: string;
  className?: string;
}

/**
 * Clean vector category icon (replaces emoji stickers for a refined UI).
 */
export function CategoryIcon({ slug, iconKey, className }: CategoryIconProps) {
  const key = (slug || iconKey || "").toLowerCase();

  switch (key) {
    case "thai":
    case "flame":
      return <Flame className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    case "japanese":
    case "fish":
      return <Fish className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    case "korean":
    case "soup":
      return <Soup className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    case "chinese":
    case "utensils":
      return <Utensils className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    case "italian":
    case "pizza":
      return <Pizza className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    case "fast-food":
    case "sandwich":
      return <Sandwich className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
    default:
      return (
        <UtensilsCrossed className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />
      );
  }
}
