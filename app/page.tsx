// ============================================================================
// Home Page - Public Landing Page
// ============================================================================
/**
 * Main home page - accessible to everyone
 *
 * Features:
 * - Shows welcome message and login/signup buttons if not logged in
 * - Shows payment gateway interface if logged in
 * - Session timer and logout button in header (when logged in)
 */
// ============================================================================

"use client";

import PaymentForm from "@/components/PaymentForm";
import SessionTimer from "@/components/SessionTimer";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* ===== Header ===== */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4 p-4">
          <div className="flex gap-4 items-center text-black">
            <h1 className="text-2xl font-bold">Home</h1>
            {status === "authenticated" && (
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
            )}
          </div>
          <div className="flex gap-4 items-center">
            {status === "authenticated" ? (
              <>
                <SessionTimer />
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex items-center justify-center">
        {status === "authenticated" ? (
          // Logged in: Show payment gateway
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                Payment Gateway
              </h2>
              <p className="text-gray-600">
                Practice Stripe integration with multiple currencies
              </p>
            </div>
            <PaymentForm />
          </div>
        ) : (
          // Not logged in: Show welcome message
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Payment Gateway
            </h2>
            <p className="text-gray-600 mb-6">
              Please login or sign up to access the payment gateway and
              dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
