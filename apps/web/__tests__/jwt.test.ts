import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/jwt/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  createToken: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { auth, createToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("JWT API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated user", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("Unauthorized");
      },
    });
  });

  it("should return 404 for user not found", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe("User not found");
      },
    });
  });

  it("should return JWT token successfully", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      role: "admin",
      tenant_id: "tenant-1",
      tenant: {
        slug: "test-tenant",
        plan: "pro",
      },
    });
    (createToken as jest.Mock).mockReturnValue("jwt-token-123");

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.token).toBe("jwt-token-123");
      },
    });
  });
});
