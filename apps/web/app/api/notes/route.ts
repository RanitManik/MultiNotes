import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createNoteSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notes = await prisma.note.findMany({
      where: { tenant_id: session.user.tenantId },
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = createNoteSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { title, content } = validationResult.data;

    // Check subscription limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.plan === "free") {
      const noteCount = await prisma.note.count({
        where: { tenant_id: session.user.tenantId },
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
        title: title ?? "",
        content,
        tenant_id: session.user.tenantId,
        author_id: session.user.id,
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
