// ============================================================================
// Session Timer Component
// ============================================================================
/**
 * Displays a visual countdown timer showing remaining session time
 *
 * Features:
 * - Shows minutes:seconds countdown
 * - Changes color to red when < 10 seconds left
 * - Uses actual session expiry from NextAuth
 * - Auto-updates every second
 * - Hides when user is not authenticated
 */
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SessionTimer() {
  const { data: session, status } = useSession();
  const [timeLeft, setTimeLeft] = useState(0);

  // ===== Calculate Time Left from NextAuth Session =====
  useEffect(() => {
    if (status !== "authenticated" || !session?.expires) {
      return;
    }

    // Calculate time remaining
    const calculateTimeLeft = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeLeftMs = Math.max(0, expiresAt - now);
      const secondsLeft = Math.floor(timeLeftMs / 1000);
      return secondsLeft;
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const secondsLeft = calculateTimeLeft();
      setTimeLeft(secondsLeft);

      if (secondsLeft === 0) {
        console.log("⏰ SessionTimer: Countdown reached 0!");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.expires, status]);

  // ===== Hide Timer When Not Authenticated =====
  if (status !== "authenticated") {
    return null;
  }

  // ===== Format Time Display =====
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className={`px-4 py-2 rounded-lg font-medium ${
        timeLeft <= 10
          ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      ⏱️ Session expires in: {minutes}:{seconds.toString().padStart(2, "0")}
      {timeLeft <= 10 && " - Auto logout soon!"}
    </div>
  );
}
