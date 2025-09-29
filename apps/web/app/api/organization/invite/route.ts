import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 }
      );
    }

    // Get user with tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    });

    if (!user?.tenant) {
      return NextResponse.json(
        { error: "User must have an organization to send invites" },
        { status: 400 }
      );
    }

    const results = [];

    for (const email of emails) {
      if (!email || typeof email !== "string") continue;

      const trimmedEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) continue;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingUser) {
        // If user exists but doesn't have a tenant, they can join
        if (!existingUser.tenant_id) {
          // Update user to join this tenant
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { tenant_id: user.tenant.id },
          });
          results.push({ email: trimmedEmail, status: "joined" });
        } else if (existingUser.tenant_id === user.tenant.id) {
          results.push({ email: trimmedEmail, status: "already_member" });
        } else {
          results.push({
            email: trimmedEmail,
            status: "already_in_another_org",
          });
        }
        continue;
      }

      // For new users, we would need to create an invitation system
      // For now, just mark as invited (we'll implement proper invites later)
      results.push({ email: trimmedEmail, status: "invited" });
    }

    return NextResponse.json({
      message: "Invites processed successfully",
      results,
    });
  } catch (error) {
    console.error("Send invites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
