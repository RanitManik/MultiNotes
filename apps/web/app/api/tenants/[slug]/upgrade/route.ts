import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  if (user.tenantSlug !== params.slug) {
    return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    await prisma.tenant.update({
      where: { slug: params.slug },
      data: { plan: "pro" },
    });

    return NextResponse.json({ message: "Upgraded to Pro" });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
