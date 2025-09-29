import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import jwt from "jsonwebtoken";

const config: NextAuthConfig = {
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async data => {
      const { name, ...rest } = data;
      return prisma.user.create({
        data: {
          ...rest,
          first_name: name || null,
          role: "admin", // Default role for OAuth users
        },
      });
    },
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // If you trust GitHub's email verification, allow linking by email to avoid OAuthAccountNotLinked
      // Note: this is considered "dangerous" because it will link accounts by email without an
      // explicit user action. It's acceptable here for developer convenience on a personal app.
      allowDangerousEmailAccountLinking: true,
      // Ensure we request user's email addresses from GitHub
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Attempt to link OAuth accounts by email when possible to avoid OAuthAccountNotLinked.
      // We still allow sign in even if linking fails.
      try {
        if (account?.provider && user?.email) {
          // Find existing user by email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (existingUser) {
            // If account row doesn't exist for this provider+id, create it
            const alreadyLinked = existingUser.accounts.find(
              a =>
                a.provider === account.provider &&
                a.providerAccountId === account.providerAccountId
            );

            if (!alreadyLinked) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type ?? "oauth",
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token ?? null,
                  access_token: account.access_token ?? null,
                  expires_at: account.expires_at ?? null,
                  token_type: account.token_type ?? null,
                  scope: account.scope ?? null,
                  id_token: account.id_token ?? null,
                  session_state:
                    account.session_state == null
                      ? null
                      : String(account.session_state),
                },
              });
            }
          }
        }

        return true;
      } catch (err) {
        console.error("signIn callback error:", err);
        // Don't block sign in flow for non-critical linking errors
        return true;
      }
    },
    async session({ session, user }) {
      // Build a sanitized session.user object so we never leak DB-only fields
      // (for example `password_hash`). Only expose fields safe for the client.
      const safeUser: any = {
        id: user.id,
        name: user.name ?? session.user?.name ?? null,
        email: user.email ?? session.user?.email ?? null,
        image: user.image ?? session.user?.image ?? null,
      };

      // Ensure tenant info is included and present on the session
      const userWithTenant = await prisma.user.findUnique({
        where: { id: user.id },
        include: { tenant: true },
      });
      if (userWithTenant?.tenant) {
        safeUser.tenantId = userWithTenant.tenant_id;
        safeUser.tenantSlug = userWithTenant.tenant.slug;
        safeUser.tenantPlan = userWithTenant.tenant.plan;
      } else {
        // User doesn't have a tenant yet - will be handled in middleware
        safeUser.tenantId = null;
        safeUser.tenantSlug = null;
        safeUser.tenantPlan = null;
      }

      // Optionally expose role (useful client-side) but avoid any secrets
      if ((user as any).role) safeUser.role = (user as any).role;

      session.user = safeUser;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config) as {
  handlers: any;
  auth: any;
  signIn: any;
  signOut: any;
};

// Custom auth functions for JWT-based auth
export interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  tenantPlan: string;
}

export function createToken(payload: User): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function requireAuth(request: Request): User | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}
