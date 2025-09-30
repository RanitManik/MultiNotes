import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/organization/create/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Organization Create API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated user", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "Test Org" }),
        });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("Unauthorized");
      },
    });
  });

  it("should return 400 for missing name", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Organization name is required");
      },
    });
  });

  it("should return 400 for empty name", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Organization name is required");
      },
    });
  });

  it("should return 400 for user with existing tenant", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      tenant: { id: "tenant-1" },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "Test Org" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("User already has an organization");
      },
    });
  });

  it("should return 409 for existing tenant slug", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      tenant: null,
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: "existing-tenant",
      slug: "test-org",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "Test Org" }),
        });
        expect(res.status).toBe(409);
        const json = await res.json();
        expect(json.error).toBe("Organization name already taken");
      },
    });
  });

  it("should create organization successfully", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      tenant: null,
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.tenant.create as jest.Mock).mockResolvedValue({
      id: "tenant-1",
      slug: "test-org",
      name: "Test Org",
      plan: "free",
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "Test Org" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("Organization created successfully");
        expect(json.tenant.slug).toBe("test-org");
      },
    });
  });
});
