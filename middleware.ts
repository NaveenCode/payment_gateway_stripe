// ============================================================================
// NextAuth Middleware - Route Protection
// ============================================================================
/**
 * Middleware to protect routes from unauthenticated access
 *
 * This middleware runs BEFORE every request and checks if the user is logged in.
 * If not logged in, it redirects to the login page.
 *
 * Public Routes (accessible without login):
 * - / (home page)
 * - /login
 * - /signup
 * - /api/auth/* (NextAuth API routes)
 * - /_next/* (Next.js static files)
 * - /favicon.ico
 *
 * Protected Routes (require login):
 * - /dashboard
 * - /resend
 * - /success
 * - /cancel
 * - All other routes
 */
// ============================================================================

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // This function runs for authenticated requests
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access if user has a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// ============================================================================
// Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - / (home page - root path)
     * - /login
     * - /signup
     * - /api/auth/* (NextAuth API routes)
     * - /_next/* (Next.js static files)
     * - /favicon.ico
     * - Files with extensions (images, etc.)
     */
    "/((?!$|api/auth|_next|favicon.ico|.*\\..*|login|signup).*)",
  ],
};
