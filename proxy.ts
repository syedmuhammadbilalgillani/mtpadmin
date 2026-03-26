// middleware.ts

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import logger from "./lib/logger";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const method = req.method;
  
  logger.info(`[Middleware] ${method} ${pathname}`, {
    pathname,
    method,
    origin: req.nextUrl.origin,
  });
  
  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith("/_next") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) ||
    pathname.includes(".")
  ) {
    logger.debug(`[Middleware] Skipping static/API route: ${pathname}`);
    return NextResponse.next();
  }

  // Get the user's session token (JWT) - we need this for all routes
  let token;
  try {
    // Use the same secret as auth config
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      logger.error("[Middleware] NEXTAUTH_SECRET is not set!");
      return NextResponse.next(); // Allow request if secret is missing (should not happen in production)
    }

    token = await getToken({ 
      req, 
      secret,
    });
    
    logger.debug(`[Middleware] Token check`, {
      pathname,
      hasToken: !!token,
      tokenRole: token?.role,
      tokenId: token?.id,
      secretExists: !!secret,
    });
  } catch (error) {
    logger.error(`[Middleware] Error getting token for ${pathname}`, error);
    // Continue without token
  }

  // Check if user is trying to access auth pages (signin/signup)
  const isAuthPage = pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup");
  
  // If authenticated user tries to access auth pages, redirect to main page
  if (isAuthPage && token) {
    logger.info(`[Middleware] Authenticated user trying to access auth page, redirecting to main page`, {
      pathname,
      userId: token.id,
      role: token.role,
    });
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to sign-in
  if (!isAuthPage && !token) {
    logger.warn(`[Middleware] Unauthenticated access attempt to protected route: ${pathname}`);
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    logger.info(`[Middleware] Redirecting to sign-in with callback: ${pathname}`);
    return NextResponse.redirect(signInUrl);
  }

  // Allow unauthenticated users to access auth pages
  if (isAuthPage && !token) {
    logger.debug(`[Middleware] Unauthenticated user accessing auth page: ${pathname}`);
    return NextResponse.next();
  }

  // Root is already the protected home; allow it.
  if (pathname === "/" && token) {
    return NextResponse.next();
  }

  // Optionally, check for specific roles if you want role-based access (e.g., Admin routes)
  if (pathname.startsWith("/admin") && token?.role !== "admin") {
    logger.warn(`[Middleware] Unauthorized access attempt to admin route`, {
      pathname,
      userId: token?.id,
      userRole: token?.role,
      requiredRole: "admin",
    });
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  logger.info(`[Middleware] Access granted`, {
    pathname,
    userId: token?.id,
    role: token?.role,
  });

  return NextResponse.next();
}

// Specify paths where the middleware should apply
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};