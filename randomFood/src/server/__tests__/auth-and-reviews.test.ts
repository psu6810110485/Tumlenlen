import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";
import {
  AuthServiceError,
  deleteUserAccount,
  getUserProfile,
  loginUser,
  registerUser,
} from "@/server/services/auth-service";
import {
  listUserFavorites,
  toggleFavorite,
} from "@/server/services/favorite-service";
import { listUserRandomHistory } from "@/server/services/history-service";
import { randomizeMenu } from "@/server/services/menu-service";
import { resetMockUserStore } from "@/server/services/mock-user-store";
import {
  deleteUserReview,
  listRestaurantReviews,
  upsertUserReview,
} from "@/server/services/review-service";
import { registerRequestSchema } from "@/server/validators/auth";
import { upsertReviewSchema } from "@/server/validators/user-activity";

describe("Phase 5: Password Hashing & Signed Session Tokens", () => {
  it("hashes password with per-user salt and verifies correctly", () => {
    const hash1 = hashPassword("SecretPass123!");
    const hash2 = hashPassword("SecretPass123!");

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword("SecretPass123!", hash1)).toBe(true);
    expect(verifyPassword("WrongPass123!", hash1)).toBe(false);
  });

  it("creates, verifies, and rejects tampered or expired session tokens", () => {
    const token = createSessionToken(
      {
        userId: "user-1",
        email: "alice@example.com",
        displayName: "Alice",
        role: "USER",
      },
      3600
    );

    const decoded = verifySessionToken(token);
    expect(decoded?.userId).toBe("user-1");
    expect(decoded?.email).toBe("alice@example.com");

    // Tampered signature must fail
    const tampered = `${token.slice(0, -4)}AAAA`;
    expect(verifySessionToken(tampered)).toBeNull();

    // Expired token must fail
    const expired = createSessionToken(
      {
        userId: "user-1",
        email: "alice@example.com",
        displayName: "Alice",
        role: "USER",
      },
      -10
    );
    expect(verifySessionToken(expired)).toBeNull();
  });

  it("enforces PDPA consent and minimum password length in registerRequestSchema", () => {
    expect(
      registerRequestSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        displayName: "Tester",
        pdpaAccepted: false,
      }).success
    ).toBe(false);

    expect(
      registerRequestSchema.safeParse({
        email: "test@example.com",
        password: "short",
        displayName: "Tester",
        pdpaAccepted: true,
      }).success
    ).toBe(false);
  });

  it("validates web review rating range (1-5) and comment length", () => {
    expect(
      upsertReviewSchema.safeParse({
        restaurantId: "mock-rest-bkk-01",
        rating: 6,
        comment: "อร่อยมากครับ",
      }).success
    ).toBe(false);

    expect(
      upsertReviewSchema.safeParse({
        restaurantId: "mock-rest-bkk-01",
        rating: 5,
        comment: "ดี",
      }).success
    ).toBe(false);
  });
});

describe("Phase 5: Auth, Reviews, Favorites, History & PDPA Erasure", () => {
  beforeEach(() => {
    process.env.EXTERNAL_API_MODE = "mock";
    resetMockUserStore();
  });

  it("registers, logs in, rejects duplicate email and wrong password", async () => {
    const { user } = await registerUser({
      email: "ploy@example.com",
      password: "MySecurePassword1",
      displayName: "พลอย",
      pdpaAccepted: true,
    });

    expect(user.email).toBe("ploy@example.com");
    expect(user.pdpaConsentAt).not.toBeNull();

    // Duplicate email throws CONFLICT
    await expect(
      registerUser({
        email: "ploy@example.com",
        password: "AnotherPassword1",
        displayName: "พลอย 2",
        pdpaAccepted: true,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    // Valid login succeeds
    const loggedIn = await loginUser({
      email: "ploy@example.com",
      password: "MySecurePassword1",
    });
    expect(loggedIn.user.id).toBe(user.id);

    // Wrong password throws UNAUTHORIZED
    await expect(
      loginUser({
        email: "ploy@example.com",
        password: "WrongPassword",
      })
    ).rejects.toBeInstanceOf(AuthServiceError);
  });

  it("manages web reviews, favorites, random history, and PDPA account erasure", async () => {
    const { user } = await registerUser({
      email: "beam@example.com",
      password: "BeamPassword123",
      displayName: "บีม",
      pdpaAccepted: true,
    });

    // 1. Upsert review & update same user's review (no duplicates per restaurant)
    const rev1 = await upsertUserReview(user.id, user.displayName, {
      restaurantId: "mock-rest-bkk-01",
      rating: 4,
      comment: "ผัดกะเพราหอมมาก เผ็ดกำลังดี",
    });
    const rev2 = await upsertUserReview(user.id, user.displayName, {
      restaurantId: "mock-rest-bkk-01",
      rating: 5,
      comment: "กลับมาซ้ำรอบสอง อร่อยกว่าเดิม!",
    });
    expect(rev2.id).toBe(rev1.id);

    const restReviews = await listRestaurantReviews("mock-rest-bkk-01");
    expect(restReviews.appReviewCount).toBe(1);
    expect(restReviews.appRatingAvg).toBe(5);

    // 2. Toggle favorite on and off
    const favOn = await toggleFavorite(user.id, {
      restaurantId: "mock-rest-bkk-01",
    });
    expect(favOn.isFavorited).toBe(true);
    expect((await listUserFavorites(user.id)).length).toBe(1);

    // 3. Random history recorded for user
    await randomizeMenu(
      {
        categories: ["thai"],
        priceTier: "ANY",
        mealType: "ANY",
        excludeMenuIds: [],
      },
      { userId: user.id }
    );
    const history = await listUserRandomHistory(user.id);
    expect(history.length).toBeGreaterThan(0);

    // 4. Delete review works
    expect(await deleteUserReview(user.id, rev2.id)).toBe(true);
    expect((await listRestaurantReviews("mock-rest-bkk-01")).appReviewCount).toBe(0);

    // 5. PDPA Right to Erasure removes user + favorites + history
    await deleteUserAccount(user.id);
    expect((await getUserProfile(user.id)).user).toBeNull();
    expect((await listUserFavorites(user.id)).length).toBe(0);
    expect((await listUserRandomHistory(user.id)).length).toBe(0);
  });
});
