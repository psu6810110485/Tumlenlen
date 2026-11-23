import { expect, test } from "@playwright/test";

test.describe("Food Roulette — Full User Journey E2E", () => {
  test("Register new user -> Select Province/District -> Randomize dish -> View restaurant detail", async ({
    page,
  }) => {
    const uniqueId = Date.now();
    const testEmail = `e2e.user.${uniqueId}@example.com`;
    const testName = `ผู้ทดสอบ ${String(uniqueId).slice(-4)}`;
    const testPassword = "TestPassword123!";

    try {
      // 1. Register a new account (including password eye-toggle + PDPA consent)
      await page.goto("/auth/register");
      await expect(
        page.getByRole("heading", { name: "สมัครสมาชิก" })
      ).toBeVisible();

      await page.locator("#register-name").fill(testName);
      await page.locator("#register-email").fill(testEmail);
      await page.locator("#register-password").fill(testPassword);

      // Verify password eye-toggle button reveals and hides password
      const eyeToggle = page
        .getByRole("button", { name: "แสดงรหัสผ่าน" })
        .first();
      await eyeToggle.click();
      await expect(page.locator("#register-password")).toHaveAttribute(
        "type",
        "text"
      );
      await page.getByRole("button", { name: "ซ่อนรหัสผ่าน" }).first().click();
      await expect(page.locator("#register-password")).toHaveAttribute(
        "type",
        "password"
      );

      await page.locator("#register-confirm-password").fill(testPassword);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "สมัครสมาชิก" }).click();

      // Should redirect to /profile and display the registered user's name
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.getByText(testName).first()).toBeVisible();

      // 2. Navigate to Home and select Province / District manually
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "วันนี้กินอะไรดี?" })
      ).toBeVisible();

      await page.getByRole("button", { name: "เลือกจังหวัด / อำเภอ" }).click();
      await page.locator("#location-province-select").selectOption("สงขลา");
      await page.locator("#location-district-select").selectOption("หาดใหญ่");
      await page.getByRole("button", { name: "5 กม." }).click();

      // Submit discovery form -> /random
      await page.getByRole("button", { name: "สุ่มอาหารเลย!" }).click();
      await expect(page).toHaveURL(/\/random/);

      // 3. Wait for roulette animation to finish and proceed to matching restaurants
      const findRestaurantsLink = page.getByRole("link", {
        name: "ค้นหาร้านที่ขายเมนูนี้",
      });
      await expect(findRestaurantsLink).toBeVisible({ timeout: 20_000 });
      await findRestaurantsLink.click();

      // 4. Restaurant Finder page (/restaurants) -> click first restaurant detail
      await expect(page).toHaveURL(/\/restaurants/);
      const firstDetailLink = page
        .getByRole("link", { name: "ดูรายละเอียดร้าน" })
        .first();
      await expect(firstDetailLink).toBeVisible({ timeout: 20_000 });
      await firstDetailLink.click();

      // 5. Restaurant Detail page (/restaurants/[id])
      await expect(page).toHaveURL(/\/restaurants\/.+/);
      await expect(page.locator("h1")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /คะแนนและรีวิว/ })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /เปิดแผนที่นำทาง Google Maps/ })
      ).toBeVisible();
    } finally {
      // Clean up temporary E2E user account via PDPA Right to Erasure
      await page.request.delete("/api/v1/auth/me").catch(() => {});
    }
  });

  test("Select live GPS coordinates -> Randomize dish -> View restaurant detail", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: 13.7447, longitude: 100.5335 }, // Pathum Wan, Bangkok
      locale: "th-TH",
    });
    const page = await context.newPage();

    try {
      await page.goto("/");
      await page.getByRole("button", { name: "ใช้ GPS ปัจจุบัน" }).click();
      await expect(page.getByText(/พิกัด GPS ปัจจุบัน:/)).toBeVisible();

      await page.getByRole("button", { name: "สุ่มอาหารเลย!" }).click();
      await expect(page).toHaveURL(/\/random/);

      const findRestaurantsLink = page.getByRole("link", {
        name: "ค้นหาร้านที่ขายเมนูนี้",
      });
      await expect(findRestaurantsLink).toBeVisible({ timeout: 20_000 });
      await findRestaurantsLink.click();

      await expect(page).toHaveURL(/\/restaurants/);
      const firstDetailLink = page
        .getByRole("link", { name: "ดูรายละเอียดร้าน" })
        .first();
      await expect(firstDetailLink).toBeVisible({ timeout: 20_000 });
      await firstDetailLink.click();

      await expect(page).toHaveURL(/\/restaurants\/.+/);
      await expect(page.locator("h1")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /รายการเมนูที่จับคู่กับร้านนี้/ })
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
