// Ensure heavy ESM modules (like next-auth) are mocked before the route module is loaded.
// We'll reset modules and dynamically import the route after applying mocks.
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock next-auth to prevent Jest from trying to parse its ESM runtime during tests.
// Provide runtime `signIn` and `auth` implementations that consult the mocked `prisma`.
jest.mock("next-auth", () => ({
  __esModule: true,
  default: (config: any) => ({
    handlers: {},
    // `auth` returns a session-like object. We'll return a session with no tenant by default.
    auth: async () => ({ user: { tenantId: null } }),
    // signIn will check the mocked prisma for the user and return an error if not found.
    signIn: async (provider: string, opts: any) => {
      // `prisma` is imported later in this test file and is a mocked object, so we can use it at runtime.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { prisma } = require("@/lib/db");
      const user = await prisma.user.findUnique({
        where: { email: opts.email },
      });
      if (!user) return { error: "Invalid credentials" };
      return { error: null };
    },
    signOut: async () => ({}),
  }),
}));

// Mock @auth/prisma-adapter which ships ESM 'export' syntax Jest can't parse by default
jest.mock("@auth/prisma-adapter", () => ({
  __esModule: true,
  PrismaAdapter: (prisma: any) => ({
    // Provide the methods NextAuth expects from the adapter.
    createUser: jest.fn(async (data: any) => ({ id: "mock-id", ...data })),
    // other adapter methods can be added if tests need them
  }),
}));

// Mock provider modules from next-auth so we don't load ESM provider files.
jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: (opts: any) => ({ id: "github", ...opts }),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: (opts: any) => ({ id: "google", ...opts }),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (opts: any) => ({ id: "credentials", ...opts }),
}));

// Mock the application's auth wrapper so route imports don't execute NextAuth at test time
jest.mock("@/lib/auth", () => ({
  signIn: jest.fn(),
  auth: jest.fn(),
  signOut: jest.fn(),
}));

import { testApiHandler } from "next-test-api-route-handler";
import { prisma } from "@/lib/db";

describe("Login API", () => {
  let appHandler: any;

  beforeEach(async () => {
    jest.resetModules();
    // Configure the app auth mock to consult the mocked prisma at runtime
    const authMod = require("@/lib/auth");
    (authMod.signIn as jest.Mock).mockImplementation(
      async (provider: string, opts: any) => {
        const user = await prisma.user.findUnique({
          where: { email: opts.email },
        });
        if (!user) return { error: "Invalid credentials" };
        return { error: null };
      }
    );
    (authMod.auth as jest.Mock).mockResolvedValue({ user: { tenantId: null } });

    // re-import the mocked modules + route after mocks were registered
    appHandler = await import("../app/api/auth/login/route");
    jest.clearAllMocks();
  });

  it("should return 400 for missing email", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ password: "pass" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Email and password required");
      },
    });
  });

  it("should return 400 for missing password", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Email and password required");
      },
    });
  });

  it("should return 401 for invalid credentials", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "pass" }),
        });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("Invalid credentials");
      },
    });
  });
});
