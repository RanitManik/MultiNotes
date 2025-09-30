import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/verify-email/route";

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

import { prisma } from "@/lib/db";

describe("Verify Email API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 for missing token", async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Token is required");
      },
    });
  });

  it("should return 400 for invalid token", async () => {
    (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      url: "/api/auth/verify-email?token=invalid",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid or expired token");
      },
    });
  });

  it("should verify email and redirect successfully", async () => {
    (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue({
      identifier: "test@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600000),
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});

    await testApiHandler({
      appHandler,
      url: "/api/auth/verify-email?token=valid-token",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(307); // Redirect status
        const location = res.headers.get("location");
        expect(location).toMatch(/\/auth\/login\?verified=true$/);
      },
    });
  });
});
