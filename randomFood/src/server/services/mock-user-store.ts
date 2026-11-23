/**
 * In-memory fallback store used ONLY in mock/local mode when PostgreSQL
 * is not reachable. Allows end-to-end testing of Auth, Reviews, Favorites,
 * and Random History without blocking local development.
 */

export interface MockUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "USER" | "ADMIN";
  pdpaConsentAt: string;
  createdAt: string;
}

export interface MockReviewRecord {
  id: string;
  userId: string;
  authorName: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockFavoriteRecord {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhotoUrl: string | null;
  createdAt: string;
}

export interface MockHistoryRecord {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  menuId: string;
  menuSlug: string;
  menuNameTh: string;
  categorySlug: string;
  minPrice: number;
  maxPrice: number;
  createdAt: string;
}

export interface MockPasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface MockUserDataStore {
  users: Map<string, MockUserRecord>;
  reviews: Map<string, MockReviewRecord>;
  favorites: Map<string, MockFavoriteRecord>;
  history: MockHistoryRecord[];
  passwordResetTokens: Map<string, MockPasswordResetRecord>;
}

const globalForMockUserStore = globalThis as unknown as {
  frMockUserStore: MockUserDataStore | undefined;
};

export const mockUserStore: MockUserDataStore =
  globalForMockUserStore.frMockUserStore ?? {
    users: new Map(),
    reviews: new Map(),
    favorites: new Map(),
    history: [],
    passwordResetTokens: new Map(),
  };

if (process.env.NODE_ENV !== "production") {
  globalForMockUserStore.frMockUserStore = mockUserStore;
}

export function resetMockUserStore(): void {
  mockUserStore.users.clear();
  mockUserStore.reviews.clear();
  mockUserStore.favorites.clear();
  mockUserStore.history.length = 0;
  mockUserStore.passwordResetTokens.clear();
}
