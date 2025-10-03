import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/forgot-password/route";

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

// Mock email
jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

describe("Forgot Password API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 for missing email", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Email is required");
      },
    });
  });

  it("should return success message for non-existing user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "nonexistent@example.com" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe(
          "If an account with that email exists, we've sent you a password reset link."
        );
      },
    });
  });

  it("should send reset email for existing user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });
    (randomBytes as jest.Mock).mockReturnValue(Buffer.from("token123"));
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue({});

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe(
          "If an account with that email exists, we've sent you a password reset link."
        );
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(
          "test@example.com",
          Buffer.from("token123").toString("hex")
        );
      },
    });
  });
});
