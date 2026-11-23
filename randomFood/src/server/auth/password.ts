import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const HASH_PREFIX = "scrypt";

/**
 * Hashes a plaintext password using Node's built-in scrypt with a random per-user salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const [, salt, originalHex] = parts;
  if (!salt || !originalHex) return false;

  const derivedBuffer = scryptSync(password, salt, KEY_LENGTH);
  const originalBuffer = Buffer.from(originalHex, "hex");

  if (derivedBuffer.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedBuffer, originalBuffer);
}
