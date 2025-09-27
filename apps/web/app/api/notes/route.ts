import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notes = await prisma.note.findMany({
      where: { tenant_id: user.tenantId },
      include: { author: { select: { email: true } } },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    // Check subscription limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.plan === "free") {
      const noteCount = await prisma.note.count({
        where: { tenant_id: user.tenantId },
      });

      if (noteCount >= 3) {
        return NextResponse.json(
          { error: "Free plan limit reached" },
          { status: 403 }
        );
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenant_id: user.tenantId,
        author_id: user.id,
      },
      include: { author: { select: { email: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
