import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      // Handle different types of validation errors
      const issues = validationResult.error.issues;

      // Check if required fields are missing
      const missingToken = !body.token || body.token.trim() === "";
      const missingPassword = !body.password || body.password.trim() === "";

      if (missingToken || missingPassword) {
        return NextResponse.json(
          { error: "Token and password are required" },
          { status: 400 }
        );
      }

      // Handle other validation errors
      if (issues.length > 0) {
        const firstIssue = issues[0];
        if (firstIssue) {
          if (
            firstIssue.code === "too_small" &&
            firstIssue.path.includes("password")
          ) {
            return NextResponse.json(
              { error: "Password must be at least 8 characters" },
              { status: 400 }
            );
          }
        }
      }

      const errorMessage = issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { token, password } = validationResult.data;

    // Find the reset token
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: {
          startsWith: "reset-",
        },
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Extract email from identifier
    const email = resetToken.identifier.replace("reset-", "");

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password_hash: passwordHash },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: resetToken.identifier,
          token,
        },
      },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
