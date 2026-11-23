import { createHash, randomBytes, randomUUID } from "crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import {
  sendPasswordResetEmail,
  type EmailDeliveryMode,
} from "@/server/mail/gmail-mailer";
import { mockUserStore } from "@/server/services/mock-user-store";

const RESET_TOKEN_TTL_MINUTES = 30;

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function allowMockFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

export interface RequestPasswordResetResult {
  accepted: true;
  deliveryMode: EmailDeliveryMode | "skipped";
  /** Only populated in non-production sandbox mode when Gmail SMTP is not configured */
  previewResetUrl?: string;
}

/**
 * Initiates a password reset flow:
 * - Looks up user by email without leaking whether the email exists (anti-enumeration).
 * - Generates a cryptographically secure 32-byte token, stores ONLY its SHA-256 hash.
 * - Sends the reset link via Gmail SMTP (or sandbox preview in local dev).
 */
export async function requestPasswordReset(
  rawEmail: string,
  originOverride?: string
): Promise<RequestPasswordResetResult> {
  const email = rawEmail.trim().toLowerCase();
  const env = getServerEnv();
  const baseUrl = (originOverride || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

  let matchedUser: { id: string; email: string; displayName: string } | null = null;
  let useDatabase = true;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true },
    });
    matchedUser = user;
  } catch (error) {
    if (!allowMockFallback()) throw error;
    useDatabase = false;
    for (const u of mockUserStore.users.values()) {
      if (u.email === email) {
        matchedUser = { id: u.id, email: u.email, displayName: u.displayName };
        break;
      }
    }
  }

  // Anti-enumeration: return generic success even if email is not registered
  if (!matchedUser) {
    return {
      accepted: true,
      deliveryMode: "skipped",
    };
  }

  if (useDatabase) {
    // Invalidate any previous unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: matchedUser.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: matchedUser.id,
        tokenHash,
        expiresAt,
      },
    });
  } else {
    const nowIso = new Date().toISOString();
    for (const rec of mockUserStore.passwordResetTokens.values()) {
      if (rec.userId === matchedUser.id && rec.usedAt === null) {
        rec.usedAt = nowIso;
      }
    }
    const id = randomUUID();
    mockUserStore.passwordResetTokens.set(tokenHash, {
      id,
      userId: matchedUser.id,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      createdAt: nowIso,
    });
  }

  const mailResult = await sendPasswordResetEmail({
    toEmail: matchedUser.email,
    displayName: matchedUser.displayName,
    resetUrl,
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
  });

  return {
    accepted: true,
    deliveryMode: mailResult.deliveryMode,
    ...(mailResult.previewResetUrl
      ? { previewResetUrl: mailResult.previewResetUrl }
      : {}),
  };
}

export async function verifyResetToken(
  rawToken: string
): Promise<{ valid: boolean; emailMasked?: string }> {
  if (!rawToken || rawToken.trim().length < 32) {
    return { valid: false };
  }

  const tokenHash = hashResetToken(rawToken.trim());
  const now = new Date();

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true } } },
    });

    if (!record || record.usedAt !== null || record.expiresAt <= now) {
      return { valid: false };
    }

    return {
      valid: true,
      emailMasked: maskEmail(record.user.email),
    };
  } catch (error) {
    if (!allowMockFallback()) throw error;

    const record = mockUserStore.passwordResetTokens.get(tokenHash);
    if (
      !record ||
      record.usedAt !== null ||
      new Date(record.expiresAt) <= now
    ) {
      return { valid: false };
    }

    const user = mockUserStore.users.get(record.userId);
    return {
      valid: true,
      emailMasked: user ? maskEmail(user.email) : undefined,
    };
  }
}

export async function completePasswordReset(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; reason?: "INVALID_OR_EXPIRED" }> {
  const tokenHash = hashResetToken(rawToken.trim());
  const now = new Date();
  const newPasswordHash = hashPassword(newPassword);

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt !== null || record.expiresAt <= now) {
      return { success: false, reason: "INVALID_OR_EXPIRED" };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
    ]);

    return { success: true };
  } catch (error) {
    if (!allowMockFallback()) throw error;

    const record = mockUserStore.passwordResetTokens.get(tokenHash);
    if (
      !record ||
      record.usedAt !== null ||
      new Date(record.expiresAt) <= now
    ) {
      return { success: false, reason: "INVALID_OR_EXPIRED" };
    }

    const user = mockUserStore.users.get(record.userId);
    if (!user) {
      return { success: false, reason: "INVALID_OR_EXPIRED" };
    }

    user.passwordHash = newPasswordHash;
    record.usedAt = now.toISOString();
    return { success: true };
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
