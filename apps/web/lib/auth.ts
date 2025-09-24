import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "member";
  tenantId: string;
  tenantSlug: string;
  tenantPlan: "free" | "pro";
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "24h" });
}
