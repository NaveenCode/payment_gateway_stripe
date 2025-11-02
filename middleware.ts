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
 * - /login (login page)
 * - /signup (signup page)
 * - /membership-checkout (membership checkout page)
 * - /membership-success (membership success page)
 * - /api/auth/* (NextAuth API routes)
 * - /api/signup (signup API route)
 * - /api/membership-subscription (membership payment API)
 * - /api/verify-membership (membership verification API)
 * - /_next/* (Next.js static files)
 * - /favicon.ico
 *
 * Protected Routes (require login):
 * - /dashboard (requires login AND active membership)
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
     * - /signup (signup page)
     * - /api/auth/* (NextAuth API routes)
     * - /api/signup (signup API route)
     * - /api/membership-subscription (membership API)
     * - /api/verify-membership (membership verification)
     * - /membership-checkout (membership page)
     * - /membership-success (membership success page)
     * - /_next/* (Next.js static files)
     * - /favicon.ico
     * - Files with extensions (images, etc.)
     */
    "/((?!$|api/auth|api/signup|api/membership-subscription|api/verify-membership|_next|favicon.ico|.*\\..*|login|signup|membership-checkout|membership-success).*)",
  ],
};
