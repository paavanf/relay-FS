import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

/** URL-safe random token, suitable for invites and refresh tokens. */
export function randomToken(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

/** Deterministic hash for opaque tokens we store but must never read back. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time comparison of two hex/utf8 strings of any length. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export { randomUUID };
