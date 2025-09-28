import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, tenantName } = await request.json();

    if (!email || !password || !tenantName) {
      return NextResponse.json(
        { error: "Email, password, and tenant name required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Generate tenant slug from name
    const slug = tenantName
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
        { error: "Tenant name already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: tenantName,
          plan: "free",
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          role: "admin",
          tenant_id: tenant.id,
        },
      });

      return { tenant, user };
    });

    // Create JWT token
    const token = createToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.user.tenant_id,
      tenantSlug: result.tenant.slug,
      tenantPlan: result.tenant.plan,
    });

    return NextResponse.json({
      token,
      tenant: {
        slug: result.tenant.slug,
        name: result.tenant.name,
        plan: result.tenant.plan,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
