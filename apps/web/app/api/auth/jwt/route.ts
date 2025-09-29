import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with tenant
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create JWT
    const token = createToken({
      id: user.id,
      email: user.email!,
      role: user.role,
      tenantId: user.tenant_id || "",
      tenantSlug: user.tenant?.slug || "",
      tenantPlan: user.tenant?.plan || "free",
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("JWT generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
