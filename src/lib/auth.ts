import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const AUTH_COOKIE_NAME = "catalogforge_session";
const SECRET = process.env.AUTH_SECRET || "catalogforge_secure_super_secret_jwt_key_2026";

/**
 * Hash a password using PBKDF2 with SHA512 and random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plain password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return derivedKey === key;
}

/**
 * Generate a signed session token
 */
export function createSessionToken(userId: string, email: string, role: string): string {
  const payload = JSON.stringify({
    userId,
    email,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): { userId: string; email: string; role: string } | null {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get currently authenticated user from Next.js request cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: true,
        supplier: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      supplierId: user.supplierId,
      supplierName: user.supplier?.name,
    };
  } catch {
    return null;
  }
}

export { AUTH_COOKIE_NAME };
