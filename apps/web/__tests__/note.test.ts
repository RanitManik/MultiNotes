import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "../app/api/notes/[id]/route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    note: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("Notes [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/notes/[id]", () => {
    it("should return 401 for unauthenticated user", async () => {
      (requireAuth as jest.Mock).mockReturnValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe("Unauthorized");
        },
      });
    });

    it("should return 404 for note not found", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json.error).toBe("Note not found");
        },
      });
    });

    it("should return note for authenticated user", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        title: "Test Note",
        content: "Test content",
        author: { email: "user@example.com" },
      });

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.title).toBe("Test Note");
        },
      });
    });
  });

  describe("PUT /api/notes/[id]", () => {
    it("should return 401 for unauthenticated user", async () => {
      (requireAuth as jest.Mock).mockReturnValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PUT",
            body: JSON.stringify({ title: "Updated", content: "Content" }),
          });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe("Unauthorized");
        },
      });
    });

    it("should return 400 for missing title", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PUT",
            body: JSON.stringify({ content: "Content" }),
          });
          expect(res.status).toBe(400);
          const json = await res.json();
          expect(json.error).toBe("Title and content required");
        },
      });
    });

    it("should return 404 for note not found", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PUT",
            body: JSON.stringify({ title: "Updated", content: "Content" }),
          });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json.error).toBe("Note not found");
        },
      });
    });

    it("should update note successfully", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        title: "Old Title",
        content: "Old content",
      });
      (prisma.note.update as jest.Mock).mockResolvedValue({
        id: "1",
        title: "Updated Title",
        content: "Updated content",
        author: { email: "user@example.com" },
      });

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PUT",
            body: JSON.stringify({
              title: "Updated Title",
              content: "Updated content",
            }),
          });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.title).toBe("Updated Title");
        },
      });
    });
  });

  describe("DELETE /api/notes/[id]", () => {
    it("should return 401 for unauthenticated user", async () => {
      (requireAuth as jest.Mock).mockReturnValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe("Unauthorized");
        },
      });
    });

    it("should return 404 for note not found", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json.error).toBe("Note not found");
        },
      });
    });

    it("should delete note successfully", async () => {
      (requireAuth as jest.Mock).mockReturnValue({
        id: 1,
        tenantId: 1,
      });
      (prisma.note.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        title: "Test Note",
      });

      await testApiHandler({
        appHandler,
        params: { id: "1" },
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.message).toBe("Note deleted");
        },
      });
    });
  });
});
