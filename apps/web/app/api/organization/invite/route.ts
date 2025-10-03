import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrganizationInviteEmail } from "@/lib/email";
import { inviteEmailsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = inviteEmailsSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { emails } = validationResult.data;

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

    const results: any[] = [];

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();

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

      // For new users, send invitation email
      const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/register?invite=${user.tenant.slug}`;
      await sendOrganizationInviteEmail(
        trimmedEmail,
        user.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : user.email,
        user.tenant.name,
        inviteUrl
      );
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
