import { beforeEach, describe, expect, it } from "vitest";
import { loginUser, registerUser } from "@/server/services/auth-service";
import { resetMockUserStore } from "@/server/services/mock-user-store";
import {
  completePasswordReset,
  hashResetToken,
  requestPasswordReset,
  verifyResetToken,
} from "@/server/services/password-reset-service";
import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "@/server/validators/auth";

describe("Password Reset via Gmail SMTP (Validation & Service)", () => {
  beforeEach(() => {
    process.env.EXTERNAL_API_MODE = "mock";
    process.env.GMAIL_USER = "";
    process.env.GMAIL_APP_PASSWORD = "";
    resetMockUserStore();
  });

  it("validates forgot-password and reset-password payloads with Zod", () => {
    expect(
      forgotPasswordRequestSchema.safeParse({ email: "not-an-email" }).success
    ).toBe(false);
    expect(
      forgotPasswordRequestSchema.safeParse({ email: "user@gmail.com" }).success
    ).toBe(true);

    expect(
      resetPasswordRequestSchema.safeParse({
        token: "too-short",
        newPassword: "NewPassword123",
      }).success
    ).toBe(false);
    expect(
      resetPasswordRequestSchema.safeParse({
        token: "a".repeat(64),
        newPassword: "123",
      }).success
    ).toBe(false);
  });

  it("hashes reset tokens deterministically with SHA-256", () => {
    const h1 = hashResetToken("sample-token-123");
    const h2 = hashResetToken("sample-token-123");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).not.toBe("sample-token-123");
  });

  it("returns generic accepted response for non-existent email (anti-enumeration)", async () => {
    const res = await requestPasswordReset("nobody@gmail.com");
    expect(res.accepted).toBe(true);
    expect(res.deliveryMode).toBe("skipped");
    expect(res.previewResetUrl).toBeUndefined();
  });

  it("completes full forgot -> verify -> reset -> login with new password and blocks token reuse", async () => {
    await registerUser({
      email: "reset-test@gmail.com",
      password: "OldPassword123",
      displayName: "ทดสอบรีเซ็ต",
      pdpaAccepted: true,
    });

    const req = await requestPasswordReset(
      "reset-test@gmail.com",
      "http://localhost:3000"
    );
    expect(req.accepted).toBe(true);
    expect(req.deliveryMode).toBe("sandbox-preview");
    expect(req.previewResetUrl).toContain("/auth/reset-password?token=");

    const token = new URL(req.previewResetUrl!).searchParams.get("token")!;
    expect(token.length).toBeGreaterThanOrEqual(64);

    // Token should verify as valid
    const check = await verifyResetToken(token);
    expect(check.valid).toBe(true);
    expect(check.emailMasked).toContain("@gmail.com");

    // Complete password reset
    const done = await completePasswordReset(token, "NewStrongPass456!");
    expect(done.success).toBe(true);

    // Token must not be reusable
    const secondCheck = await verifyResetToken(token);
    expect(secondCheck.valid).toBe(false);
    const secondReset = await completePasswordReset(token, "AnotherPass789!");
    expect(secondReset.success).toBe(false);

    // Login with new password succeeds; old password fails
    const loggedIn = await loginUser({
      email: "reset-test@gmail.com",
      password: "NewStrongPass456!",
    });
    expect(loggedIn.user.email).toBe("reset-test@gmail.com");

    await expect(
      loginUser({
        email: "reset-test@gmail.com",
        password: "OldPassword123",
      })
    ).rejects.toThrow();
  });
});
