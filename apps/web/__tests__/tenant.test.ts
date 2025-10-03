import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/tenant/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
    },
    note: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Tenant API", () => {
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

  it("should return 404 for tenant not found", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1", tenantId: "tenant-1" },
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe("Tenant not found");
      },
    });
  });

  it("should return tenant info for free plan", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1", tenantId: "tenant-1" },
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: "tenant-1",
      slug: "test-tenant",
      plan: "free",
    });
    (prisma.note.count as jest.Mock).mockResolvedValue(2);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: "user@example.com",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.slug).toBe("test-tenant");
        expect(json.plan).toBe("free");
        expect(json.noteCount).toBe(2);
        expect(json.limit).toBe(3);
        expect(json.email).toBe("user@example.com");
      },
    });
  });

  it("should return tenant info for pro plan", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1", tenantId: "tenant-1" },
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: "tenant-1",
      slug: "test-tenant",
      plan: "pro",
    });
    (prisma.note.count as jest.Mock).mockResolvedValue(10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: "user@example.com",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.slug).toBe("test-tenant");
        expect(json.plan).toBe("pro");
        expect(json.noteCount).toBe(10);
        expect(json.limit).toBe(null);
        expect(json.email).toBe("user@example.com");
      },
    });
  });
});
