import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
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

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role required" },
        { status: 400 }
      );
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'member'" },
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

    // Create user with default password
    const defaultPassword = "password";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: role as "admin" | "member",
        tenant_id: user.tenantId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenant: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "User invited successfully",
      user: newUser,
      defaultPassword,
    });
  } catch (error) {
    console.error("Invite user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
