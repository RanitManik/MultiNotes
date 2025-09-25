import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, createToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

  const { slug } = await params;

  if (user.tenantSlug !== slug) {
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

    // Get updated user info for new token
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newToken = createToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenant_id,
      tenantSlug: updatedUser.tenant.slug,
      tenantPlan: updatedUser.tenant.plan,
    });

    return NextResponse.json({
      message: "Upgraded to Pro",
      tenant: updatedTenant,
      token: newToken,
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
