import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/organization/invite/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock email
jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn(),
  sendOrganizationInviteEmail: jest.fn(),
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Organization Invite API", () => {
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
          body: JSON.stringify({ emails: ["test@example.com"] }),
        });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("Unauthorized");
      },
    });
  });

  it("should return 400 for missing emails", async () => {
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
        expect(json.error).toBe("At least one email is required");
      },
    });
  });

  it("should return 400 for empty emails array", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: [] }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("At least one email is required");
      },
    });
  });

  it("should return 400 for user without tenant", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      tenant: null,
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: ["test@example.com"] }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe(
          "User must have an organization to send invites"
        );
      },
    });
  });

  it("should invite new user successfully", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        tenant: { id: "tenant-1" },
      })
      .mockResolvedValueOnce(null); // For the invited user

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: ["newuser@example.com"] }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe("Invites processed successfully");
        expect(json.results).toHaveLength(1);
        expect(json.results[0]).toEqual({
          email: "newuser@example.com",
          status: "invited",
        });
      },
    });
  });

  it("should handle existing user joining tenant", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        tenant: { id: "tenant-1" },
      })
      .mockResolvedValueOnce({
        id: "2",
        email: "existing@example.com",
        tenant_id: null,
      });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: ["existing@example.com"] }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results[0]).toEqual({
          email: "existing@example.com",
          status: "joined",
        });
      },
    });
  });

  it("should handle user already in same tenant", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        tenant: { id: "tenant-1" },
      })
      .mockResolvedValueOnce({
        id: "2",
        email: "member@example.com",
        tenant_id: "tenant-1",
      });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: ["member@example.com"] }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results[0]).toEqual({
          email: "member@example.com",
          status: "already_member",
        });
      },
    });
  });

  it("should handle user in another tenant", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "1" },
    });
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        tenant: { id: "tenant-1" },
      })
      .mockResolvedValueOnce({
        id: "2",
        email: "other@example.com",
        tenant_id: "tenant-2",
      });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ emails: ["other@example.com"] }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results[0]).toEqual({
          email: "other@example.com",
          status: "already_in_another_org",
        });
      },
    });
  });
});
