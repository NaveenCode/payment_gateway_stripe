// ============================================================================
// Session Provider with Auto-Logout
// ============================================================================
/**
 * Global session provider that wraps the entire application
 *
 * Features:
 * - Monitors session status continuously
 * - Auto-logout when session expires
 * - Countdown timer in console
 * - Redirects to login page on expiration
 * - Refetches session every 1 second for fast detection
 */
// ============================================================================

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// ============================================================================
// Session Checker Component
// ============================================================================

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);
  const hasLoggedOut = useRef(false);

  // ===== Session Countdown Timer in Console =====
  useEffect(() => {
    if (status !== "authenticated" || !session?.expires) {
      return;
    }

    // Calculate time remaining
    const calculateTimeLeft = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeLeft = expiresAt - now;
      const secondsLeft = Math.max(0, Math.ceil(timeLeft / 1000));
      return secondsLeft;
    };

    // Log initial time
    const initialSeconds = calculateTimeLeft();
    console.log(`⏰ Session expires in: ${initialSeconds} seconds`);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      const secondsLeft = calculateTimeLeft();

      if (secondsLeft > 0) {
        console.log(
          `⏰ Time left before session expires: ${secondsLeft} seconds`
        );
      } else {
        console.log("❌ Session countdown reached 0!");
        clearInterval(countdownInterval);
      }
    }, 5000);

    return () => clearInterval(countdownInterval);
  }, [session?.expires, status]);

  // ===== Session Status Monitoring & Auto-Logout =====
  useEffect(() => {
    console.log("🔍 Session status:", status);

    // Track if user was authenticated before
    if (status === "authenticated" && session) {
      wasAuthenticated.current = true;
      hasLoggedOut.current = false;
      console.log("✅ User is authenticated");
    }

    // If user was authenticated but now is not, logout
    if (
      wasAuthenticated.current &&
      status === "unauthenticated" &&
      !hasLoggedOut.current
    ) {
      console.log("⏰ Session expired - Auto logout triggered!");
      hasLoggedOut.current = true;

      // Only logout if not already on login/signup pages
      if (pathname !== "/login" && pathname !== "/signup") {
        signOut({ callbackUrl: "/login", redirect: true });
      }
    }
  }, [session, status, pathname]);

  // ===== Show Loading State =====
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Main SessionProvider Export
// ============================================================================

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider
      refetchInterval={20} // ⏰ Check session every 1 second for fast auto-logout
      refetchOnWindowFocus={true} // Re-check when window gains focus
    >
      <SessionChecker>{children}</SessionChecker>
    </NextAuthSessionProvider>
  );
}
