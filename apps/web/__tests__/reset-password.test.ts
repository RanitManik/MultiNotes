import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/reset-password/route";

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    verificationToken: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

describe("Reset Password API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 for missing token", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ password: "newpassword123" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Token and password are required");
      },
    });
  });

  it("should return 400 for missing password", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ token: "reset-token" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Token and password are required");
      },
    });
  });

  it("should return 400 for weak password", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ token: "reset-token", password: "123" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Password must be at least 8 characters");
      },
    });
  });

  it("should return 400 for invalid token", async () => {
    (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            token: "invalid-token",
            password: "newpassword123",
          }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid or expired token");
      },
    });
  });

  it("should reset password successfully", async () => {
    (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue({
      identifier: "reset-test@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600000), // 1 hour from now
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("Password reset successfully");
      },
    });
  });
});
