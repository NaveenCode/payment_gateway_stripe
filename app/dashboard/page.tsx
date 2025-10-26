import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import SessionTimer from "@/components/SessionTimer";
import UserProfile from "@/components/dashboard/UserProfile";
import Link from "next/link";

export default async function DashboardPage() {
  // Check if user is logged in
  const session = await getServerSession(authOptions);

  if (!session) {
    // Not logged in? Send to login page
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        {/* Header with logout button and timer */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-black">Dashboard</h1>
          <div className="flex gap-4 items-center">
            <SessionTimer />
            <LogoutButton />
          </div>
        </div>

        {/* User Profile with Tabs */}
        <UserProfile />

        {/* Quick links */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-xl font-semibold text-black mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Make a Payment</p>
                <p className="text-sm text-gray-600">
                  Go to payment gateway
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-400">View History</p>
                <p className="text-sm text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
