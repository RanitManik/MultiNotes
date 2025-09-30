import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/register/route";

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

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
      create: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

describe("Register API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 for missing email", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ password: "password123" }),
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

  it("should return 400 for invalid email format", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            email: "invalid-email",
            password: "password123",
          }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid email format");
      },
    });
  });

  it("should return 400 for weak password", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "123" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Password must be at least 8 characters long");
      },
    });
  });

  it("should return 409 for existing user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        });
        expect(res.status).toBe(409);
        const json = await res.json();
        expect(json.error).toBe("User already exists");
      },
    });
  });

  it("should return 500 for email sending failure", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
    (randomBytes as jest.Mock).mockReturnValue(Buffer.from("token123"));
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    (sendVerificationEmail as jest.Mock).mockResolvedValue({ success: false });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe("Failed to send verification email");
      },
    });
  });

  it("should register user successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
    (randomBytes as jest.Mock).mockReturnValue(Buffer.from("token123"));
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });
    (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    (sendVerificationEmail as jest.Mock).mockResolvedValue({ success: true });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            firstName: "John",
            lastName: "Doe",
          }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe(
          "Registration successful! Please check your email to verify your account."
        );
      },
    });
  });
});
