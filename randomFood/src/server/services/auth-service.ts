import { randomUUID } from "crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { mockUserStore } from "@/server/services/mock-user-store";
import type { LoginRequest, RegisterRequest } from "@/server/validators/auth";

export interface UserProfileDTO {
  id: string;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  pdpaConsentAt: string | null;
  createdAt: string;
}

export type StorageOrigin = "database" | "mock-memory";

export class AuthServiceError extends Error {
  readonly code: "CONFLICT" | "UNAUTHORIZED" | "NOT_FOUND";
  readonly statusCode: number;

  constructor(
    code: "CONFLICT" | "UNAUTHORIZED" | "NOT_FOUND",
    message: string,
    statusCode: number
  ) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function allowMockFallback(): boolean {
  return getServerEnv().effectiveExternalMode === "mock";
}

export async function registerUser(
  input: RegisterRequest
): Promise<{ user: UserProfileDTO; storage: StorageOrigin }> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = hashPassword(input.password);
  const now = new Date();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthServiceError(
        "CONFLICT",
        "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ",
        409
      );
    }

    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: input.displayName.trim(),
        role: "USER",
        pdpaConsentAt: now,
      },
    });

    return {
      user: {
        id: created.id,
        email: created.email,
        displayName: created.displayName,
        role: created.role,
        pdpaConsentAt: created.pdpaConsentAt?.toISOString() ?? null,
        createdAt: created.createdAt.toISOString(),
      },
      storage: "database",
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;
    if (!allowMockFallback()) throw error;

    // Fallback to mock-memory store when DB is unavailable in mock mode
    for (const u of mockUserStore.users.values()) {
      if (u.email === email) {
        throw new AuthServiceError(
          "CONFLICT",
          "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ",
          409
        );
      }
    }

    const id = randomUUID();
    const record = {
      id,
      email,
      passwordHash,
      displayName: input.displayName.trim(),
      role: "USER" as const,
      pdpaConsentAt: now.toISOString(),
      createdAt: now.toISOString(),
    };
    mockUserStore.users.set(id, record);

    return {
      user: {
        id: record.id,
        email: record.email,
        displayName: record.displayName,
        role: record.role,
        pdpaConsentAt: record.pdpaConsentAt,
        createdAt: record.createdAt,
      },
      storage: "mock-memory",
    };
  }
}

export async function loginUser(
  input: LoginRequest
): Promise<{ user: UserProfileDTO; storage: StorageOrigin }> {
  const email = input.email.trim().toLowerCase();

  try {
    const found = await prisma.user.findUnique({ where: { email } });
    if (!found || !verifyPassword(input.password, found.passwordHash)) {
      throw new AuthServiceError(
        "UNAUTHORIZED",
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        401
      );
    }

    return {
      user: {
        id: found.id,
        email: found.email,
        displayName: found.displayName,
        role: found.role,
        pdpaConsentAt: found.pdpaConsentAt?.toISOString() ?? null,
        createdAt: found.createdAt.toISOString(),
      },
      storage: "database",
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;
    if (!allowMockFallback()) throw error;

    let matched = null;
    for (const u of mockUserStore.users.values()) {
      if (u.email === email) {
        matched = u;
        break;
      }
    }

    if (!matched || !verifyPassword(input.password, matched.passwordHash)) {
      throw new AuthServiceError(
        "UNAUTHORIZED",
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        401
      );
    }

    return {
      user: {
        id: matched.id,
        email: matched.email,
        displayName: matched.displayName,
        role: matched.role,
        pdpaConsentAt: matched.pdpaConsentAt,
        createdAt: matched.createdAt,
      },
      storage: "mock-memory",
    };
  }
}

export async function getUserProfile(
  userId: string
): Promise<{ user: UserProfileDTO | null; storage: StorageOrigin }> {
  try {
    const found = await prisma.user.findUnique({ where: { id: userId } });
    if (!found) return { user: null, storage: "database" };

    return {
      user: {
        id: found.id,
        email: found.email,
        displayName: found.displayName,
        role: found.role,
        pdpaConsentAt: found.pdpaConsentAt?.toISOString() ?? null,
        createdAt: found.createdAt.toISOString(),
      },
      storage: "database",
    };
  } catch (error) {
    if (!allowMockFallback()) throw error;

    const mock = mockUserStore.users.get(userId);
    if (!mock) return { user: null, storage: "mock-memory" };

    return {
      user: {
        id: mock.id,
        email: mock.email,
        displayName: mock.displayName,
        role: mock.role,
        pdpaConsentAt: mock.pdpaConsentAt,
        createdAt: mock.createdAt,
      },
      storage: "mock-memory",
    };
  }
}

/**
 * PDPA Right to Erasure: permanently removes user account and associated data.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id: userId } });
    return true;
  } catch (error) {
    if (!allowMockFallback()) throw error;

    const existed = mockUserStore.users.delete(userId);
    for (const [id, rev] of mockUserStore.reviews.entries()) {
      if (rev.userId === userId) mockUserStore.reviews.delete(id);
    }
    for (const [id, fav] of mockUserStore.favorites.entries()) {
      if (fav.userId === userId) mockUserStore.favorites.delete(id);
    }
    for (let i = mockUserStore.history.length - 1; i >= 0; i--) {
      if (mockUserStore.history[i].userId === userId) {
        mockUserStore.history.splice(i, 1);
      }
    }
    return existed;
  }
}
