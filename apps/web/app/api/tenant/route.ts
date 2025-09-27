import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Count notes for this tenant
    const noteCount = await prisma.note.count({
      where: { tenant_id: user.tenantId },
    });

    // Get user's email for display
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    return NextResponse.json({
      slug: tenant.slug,
      plan: tenant.plan,
      noteCount,
      limit: tenant.plan === "free" ? 3 : null,
      email: userRecord?.email || null,
    });
  } catch (error) {
    console.error("Get tenant info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
