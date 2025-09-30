import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/auth/invite/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Invite API", () => {
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
          body: JSON.stringify({ email: "test@example.com", role: "member" }),
        });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("Unauthorized");
      },
    });
  });

  it("should return 403 for non-admin user", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "member",
        tenantId: "1",
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", role: "member" }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toBe("Admin access required");
      },
    });
  });

  it("should return 400 for missing email", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "admin",
        tenantId: "1",
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ role: "member" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Email and role required");
      },
    });
  });

  it("should return 400 for invalid role", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "admin",
        tenantId: "1",
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", role: "invalid" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid role. Must be 'admin' or 'member'");
      },
    });
  });

  it("should return 409 for existing user", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "admin",
        tenantId: "1",
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      email: "test@example.com",
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", role: "member" }),
        });
        expect(res.status).toBe(409);
        const json = await res.json();
        expect(json.error).toBe("User already exists");
      },
    });
  });

  it("should create user successfully", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "admin",
        tenantId: "1",
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 2,
      email: "test@example.com",
      role: "member",
      tenant: {
        slug: "test-tenant",
        name: "Test Tenant",
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", role: "member" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("User invited successfully");
        expect(json.user.email).toBe("test@example.com");
        expect(json.password).toBeDefined();
        expect(typeof json.password).toBe("string");
        expect(json.password.length).toBeGreaterThan(0);
      },
    });
  });

  it("should create user with custom password", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        role: "admin",
        tenantId: "1",
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 2,
      email: "test@example.com",
      role: "member",
      tenant: {
        slug: "test-tenant",
        name: "Test Tenant",
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            role: "member",
            password: "custompassword123",
          }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("User invited successfully");
        expect(json.user.email).toBe("test@example.com");
        expect(json.password).toBe("custompassword123");
      },
    });
  });
});
