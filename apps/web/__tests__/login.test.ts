import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/login/route";

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("Login API", () => {
  beforeEach(() => {
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
