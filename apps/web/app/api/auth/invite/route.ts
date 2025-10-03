import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendOrganizationInviteEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { inviteUserSchema } from "@/lib/validations";

function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validation = inviteUserSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { email, role, password } = validation.data;

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

    // Use provided password or generate a random one
    const userPassword = password || generateRandomPassword();
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for invites

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: role as "admin" | "member",
        tenant_id: session.user.tenantId,
        emailVerified: null, // Not verified yet
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

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpires,
      },
    });

    // Send invitation email with verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
    const emailResult = await sendOrganizationInviteEmail(
      email,
      session.user.name || session.user.email || "Admin",
      newUser.tenant?.name || "the organization",
      verificationUrl
    );

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      message: "User invited successfully. An invitation email has been sent.",
      user: newUser,
      password: userPassword,
    });
  } catch (error) {
    console.error("Invite user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
