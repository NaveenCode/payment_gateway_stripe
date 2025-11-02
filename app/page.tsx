"use client";

import SessionTimer from "@/components/SessionTimer";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Membership Platform
            </h2>
            <p className="text-xl text-gray-600">
              Join our exclusive community with yearly membership benefits
            </p>
          </div>

          {status === "authenticated" ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Exclusive Access
                </h3>
                <p className="text-gray-600">
                  Access premium features and content
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Best Value
                </h3>
                <p className="text-gray-600">
                  Yearly membership with great savings
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Priority Support
                </h3>
                <p className="text-gray-600">
                  Get help whenever you need it
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-8">
                Create an account to access our exclusive membership platform with
                premium features and benefits.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
