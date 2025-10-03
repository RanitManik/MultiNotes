import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrganizationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = createOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { name } = validationResult.data;

    // Check if user already has a tenant
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    });

    if (existingUser?.tenant) {
      return NextResponse.json(
        { error: "User already has an organization" },
        { status: 400 }
      );
    }

    // Generate tenant slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Organization name already taken" },
        { status: 409 }
      );
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: name.trim(),
        plan: "free",
      },
    });

    // Update user with tenant
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        tenant_id: tenant.id,
        role: "admin",
      },
      include: { tenant: true },
    });

    return NextResponse.json({
      message: "Organization created successfully",
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
      },
      user: {
        id: updatedUser.id,
        tenantId: updatedUser.tenant_id,
        tenantSlug: updatedUser.tenant?.slug,
        tenantPlan: updatedUser.tenant?.plan,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
