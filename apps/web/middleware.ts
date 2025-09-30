import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type ExtendedUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantPlan: string | null;
  role: string;
};

export default auth((req: NextRequest & { auth: Session | null }) => {
  const { pathname } = req.nextUrl;

  // 1. Handle API CORS preflight requests (no change needed here)
  if (pathname.startsWith("/api/") && req.method === "OPTIONS") {
    // ... your CORS preflight logic
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return new NextResponse(null, { status: 204, headers });
  }

  // 2. Get the session from req.auth
  const session = req.auth; // <-- 2. Use req.auth instead of await auth()

  // 3. Define page types for clarity
  const isAuthPage = pathname.startsWith("/auth/");
  const isOrgSetupPage = pathname.startsWith("/organization/setup");
  const isRootPage = pathname === "/";

  // 4. Redirect logic for authenticated users
  if (session) {
    // 3. Access user properties via session.user
    const hasTenant = Boolean((session.user as ExtendedUser)?.tenantId);

    // If user is on an auth page or root page, redirect to /notes
    if (isAuthPage || isRootPage) {
      return NextResponse.redirect(new URL("/notes", req.url));
    }

    // If user has no tenant, force them to the setup page
    if (!hasTenant && !isOrgSetupPage) {
      return NextResponse.redirect(new URL("/organization/setup", req.url));
    }
  }

  // 5. If user is not authenticated and trying to access a protected page, you could add a redirect here.
  // For now, we allow access, and client-side logic can handle it.
  // Example:
  // if (!session && !isAuthPage && pathname !== "/") {
  //   return NextResponse.redirect(new URL("/auth/login", req.url));
  // }

  // 6. Add CORS headers to all other API responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  }

  return NextResponse.next();
});

// Keep your existing config
export const config = {
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth specific routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

export const runtime = "nodejs";
