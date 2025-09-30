import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const { slug } = await params;

  if (session.user.tenantSlug !== slug) {
    return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    await prisma.tenant.update({
      where: { slug },
      data: { plan: "pro" },
    });

    // Return updated tenant info
    const updatedTenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { slug: true, name: true, plan: true },
    });

    return NextResponse.json({
      message: "Upgraded to Pro",
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
