import type {
  RankingBreakdown,
  ResolvedMenuContext,
  RestaurantDTO,
  RestaurantMenuMatchDTO,
} from "@/server/types/restaurant";

const BAYESIAN_PRIOR_RATING = 4.0;
const BAYESIAN_PRIOR_WEIGHT = 15;

/**
 * Evaluates whether a restaurant has verifiable or keyword-inferred evidence
 * of serving the requested menu.
 *
 * Strict Rule 3:
 * - Preserves VERIFIED / INFERRED evidence already backed by DB or catalog.
 * - Infers INFERRED only when the restaurant's own name contains an explicit
 *   menu keyword (never guesses blindly).
 * - Returns null when no evidence exists.
 */
export function evaluateMenuMatch(
  restaurant: RestaurantDTO,
  menu: ResolvedMenuContext | null
): RestaurantMenuMatchDTO | null {
  if (!menu) return null;

  // Keep existing evidence if it already matches the requested menu
  if (
    restaurant.menuMatch &&
    (restaurant.menuMatch.menuSlug === menu.slug ||
      restaurant.menuMatch.menuId === menu.id)
  ) {
    return restaurant.menuMatch;
  }

  // Otherwise check explicit keyword evidence in the restaurant's name
  const normalizedName = restaurant.name.toLowerCase();
  const candidateKeywords = [
    ...menu.searchKeywords,
    menu.nameTh,
    menu.nameEn,
  ]
    .map((kw) => kw.trim())
    .filter((kw) => kw.length >= 3);

  const matchedKeyword = candidateKeywords.find((kw) =>
    normalizedName.includes(kw.toLowerCase())
  );

  if (!matchedKeyword) {
    return null;
  }

  return {
    menuId: menu.id,
    menuSlug: menu.slug,
    menuNameTh: menu.nameTh,
    verificationStatus: "INFERRED",
    evidenceSource: `ชื่อร้านตรงกับคำค้นหา "${matchedKeyword}"`,
    matchedPrice: null,
  };
}

/**
 * Computes Bayesian-smoothed rating (0-5) so restaurants with strong review volume
 * rank more reliably than single-review outliers.
 */
function computeBayesianRating(restaurant: RestaurantDTO): number {
  const gCount = restaurant.googleRating !== null ? restaurant.googleReviewCount : 0;
  const aCount = restaurant.appRatingAvg !== null ? restaurant.appReviewCount : 0;
  const totalReviews = gCount + aCount;

  if (totalReviews === 0) {
    const raw = restaurant.googleRating ?? restaurant.appRatingAvg;
    return raw !== null ? raw : 0;
  }

  const weightedSum =
    (restaurant.googleRating ?? 0) * gCount +
    (restaurant.appRatingAvg ?? 0) * aCount;

  return (
    (weightedSum + BAYESIAN_PRIOR_RATING * BAYESIAN_PRIOR_WEIGHT) /
    (totalReviews + BAYESIAN_PRIOR_WEIGHT)
  );
}

/**
 * Transparent weighted ranking algorithm (0 - 100 points):
 * - Menu Verification Status: 0 - 45 pts (VERIFIED = 45, INFERRED = 20, None = 0)
 * - Rating Quality (Bayesian): 0 - 25 pts
 * - Proximity within radiusKm: 0 - 20 pts
 * - Open Now Status: 0 - 10 pts (Open = 10, Unknown = 4, Closed = 0)
 */
export function computeRestaurantRankScore(
  restaurant: RestaurantDTO,
  options: { radiusKm: number; hasMenuQuery: boolean }
): RankingBreakdown {
  let verificationScore = 0;
  if (options.hasMenuQuery) {
    if (restaurant.menuMatch?.verificationStatus === "VERIFIED") {
      verificationScore = 45;
    } else if (restaurant.menuMatch?.verificationStatus === "INFERRED") {
      verificationScore = 20;
    }
  } else {
    // When browsing without a specific menu, normalize base score so total stays informative
    verificationScore = 25;
  }

  const bayesianRating = computeBayesianRating(restaurant);
  const ratingScore = Number(((Math.min(bayesianRating, 5) / 5) * 25).toFixed(1));

  const safeRadius = Math.max(options.radiusKm, 0.5);
  const proximityRatio = Math.max(0, Math.min(1, 1 - restaurant.distanceKm / safeRadius));
  const proximityScore = Number((proximityRatio * 20).toFixed(1));

  let openNowScore = 4;
  if (restaurant.openingHours.isOpenNow === true) {
    openNowScore = 10;
  } else if (restaurant.openingHours.isOpenNow === false) {
    openNowScore = 0;
  }

  const totalScore = Math.round(
    Math.min(100, verificationScore + ratingScore + proximityScore + openNowScore)
  );

  return {
    totalScore,
    verificationScore,
    ratingScore,
    proximityScore,
    openNowScore,
  };
}
