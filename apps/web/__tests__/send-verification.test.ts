import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/send-verification/route";

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

// Mock email
jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn(),
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
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

describe("Send Verification API", () => {
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
          "If an account with this email exists, a verification email has been sent."
        );
      },
    });
  });

  it("should return 500 for email sending failure", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });
    (randomBytes as jest.Mock).mockReturnValue(Buffer.from("token123"));
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    (sendVerificationEmail as jest.Mock).mockResolvedValue({ success: false });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe("Failed to send verification email");
      },
    });
  });

  it("should send verification email successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });
    (randomBytes as jest.Mock).mockReturnValue(Buffer.from("token123"));
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    (sendVerificationEmail as jest.Mock).mockResolvedValue({ success: true });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("Verification email sent successfully");
      },
    });
  });
});
