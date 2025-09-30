import { NextRequest, NextResponse } from "next/server";
import { signIn, auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Use NextAuth signIn with credentials
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Don't redirect, return result
    });

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Get the session to check tenant
    const session = await auth();

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        {
          error: "Please complete organization setup",
          redirect: "/organization/setup",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
