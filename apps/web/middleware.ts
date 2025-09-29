import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle API CORS preflight requests
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return new NextResponse(null, { status: 204, headers });
  }

  // 2. Securely get the session token
  // The secret is read from the NEXTAUTH_SECRET environment variable.
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. Define page types for clarity
  const isAuthPage = pathname.startsWith("/auth/");
  const isOrgSetupPage = pathname.startsWith("/organization/setup");

  // 4. Redirect logic for authenticated users
  if (session) {
    const hasTenant = Boolean(session.tenantId);

    // If user is on an auth page (e.g., login/register), redirect them away
    if (isAuthPage) {
      const redirectUrl = hasTenant ? "/notes" : "/organization/setup";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // If user has no tenant, force them to the setup page
    if (!hasTenant && !isOrgSetupPage) {
      return NextResponse.redirect(new URL("/organization/setup", request.url));
    }
  }

  // 5. If user is not authenticated and trying to access a protected page, you could add a redirect here.
  // For now, we allow access, and client-side logic can handle it.
  // Example:
  // if (!session && !isAuthPage && pathname !== "/") {
  //   return NextResponse.redirect(new URL("/auth/login", request.url));
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
}

// Keep your existing config
export const config = {
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
