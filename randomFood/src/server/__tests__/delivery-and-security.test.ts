import { describe, expect, it } from "vitest";
import {
  buildDeliveryLinks,
  isVerifiedDeliveryUrl,
} from "@/lib/delivery-links";
import { RateLimiter } from "@/server/security/rate-limiter";

describe("Phase 6: Delivery Links Whitelist & Search Fallback", () => {
  it("accepts only HTTPS whitelisted GrabFood and LINE MAN domains", () => {
    expect(
      isVerifiedDeliveryUrl(
        "https://food.grab.com/th/th/restaurant/some-shop/123",
        "GRABFOOD"
      )
    ).toBe(true);
    expect(
      isVerifiedDeliveryUrl("https://lineman.line.me/restaurant/123", "LINEMAN")
    ).toBe(true);
    expect(
      isVerifiedDeliveryUrl("https://www.wongnai.com/restaurants/123", "LINEMAN")
    ).toBe(true);

    // Reject non-HTTPS, javascript:, and untrusted domains
    expect(
      isVerifiedDeliveryUrl("http://food.grab.com/th/th/restaurant/123", "GRABFOOD")
    ).toBe(false);
    expect(
      isVerifiedDeliveryUrl("javascript:alert(1)", "GRABFOOD")
    ).toBe(false);
    expect(
      isVerifiedDeliveryUrl("https://evil-grab.example.com/shop", "GRABFOOD")
    ).toBe(false);
    expect(
      isVerifiedDeliveryUrl("https://evil-lineman.example.com/shop", "LINEMAN")
    ).toBe(false);
  });

  it("falls back safely to transparent Search URLs when direct URL is missing or untrusted", () => {
    const links = buildDeliveryLinks(
      "ครัวกะเพราไฟแรง (Mock)",
      "https://phishing.example.com/grab",
      null
    );

    expect(links).toHaveLength(2);
    expect(links[0].provider).toBe("GRABFOOD");
    expect(links[0].isVerifiedDirectUrl).toBe(false);
    expect(links[0].url).toContain("https://food.grab.com/th/th/restaurants?search=");
    expect(links[0].url).not.toContain("(Mock)");

    expect(links[1].provider).toBe("LINEMAN");
    expect(links[1].isVerifiedDirectUrl).toBe(false);
    expect(links[1].url).toContain("https://www.wongnai.com/restaurants?q=");
  });
});

describe("Phase 6: API Rate Limiter", () => {
  it("enforces maxRequests per window and resets after window expires", () => {
    const limiter = new RateLimiter(100);
    const t0 = 1_000_000;

    const r1 = limiter.check("auth-login:1.2.3.4", 2, 10_000, t0);
    const r2 = limiter.check("auth-login:1.2.3.4", 2, 10_000, t0 + 100);
    const r3 = limiter.check("auth-login:1.2.3.4", 2, 10_000, t0 + 200);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfterSeconds).toBeGreaterThanOrEqual(1);

    // After window passes, counter resets
    const r4 = limiter.check("auth-login:1.2.3.4", 2, 10_000, t0 + 10_001);
    expect(r4.allowed).toBe(true);
    expect(r4.remaining).toBe(1);
  });
});
