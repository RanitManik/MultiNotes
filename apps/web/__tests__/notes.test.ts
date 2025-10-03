import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/notes/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    note: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Notes API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/notes", () => {
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

    it("should return notes for authenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          tenantId: "1",
        },
      });
      (prisma.note.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          title: "Test Note",
          content: "Test content",
          author: { email: "user@example.com" },
        },
      ]);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toHaveLength(1);
          expect(json[0].title).toBe("Test Note");
        },
      });
    });
  });

  describe("POST /api/notes", () => {
    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ title: "Test", content: "Content" }),
          });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe("Unauthorized");
        },
      });
    });

    it("should return 400 for missing title", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          tenantId: "1",
        },
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ content: "Content" }),
          });
          expect(res.status).toBe(400);
          const json = await res.json();
          expect(json.error).toBe("Title and content required");
        },
      });
    });

    it("should return 403 for free plan limit reached", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          tenantId: "1",
        },
      });
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        plan: "free",
      });
      (prisma.note.count as jest.Mock).mockResolvedValue(3);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ title: "Test", content: "Content" }),
          });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toBe("Free plan limit reached");
        },
      });
    });

    it("should create note successfully", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          tenantId: "1",
        },
      });
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        plan: "pro",
      });
      (prisma.note.create as jest.Mock).mockResolvedValue({
        id: 1,
        title: "Test Note",
        content: "Test content",
        author: { email: "user@example.com" },
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({
              title: "Test Note",
              content: "Test content",
            }),
          });
          expect(res.status).toBe(201);
          const json = await res.json();
          expect(json.title).toBe("Test Note");
          expect(json.content).toBe("Test content");
        },
      });
    });
  });
});
