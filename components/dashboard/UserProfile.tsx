"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MembershipSection from "./MembershipSection";
import PaymentDetailsSection from "./PaymentDetailsSection";

interface MembershipDetails {
  membershipType: "internal" | "external";
  customerId: string | null;
  price: number | null;
  currency: string | null;
  lastPaymentDate: string | null;
  paymentIntentId: string | null;
  invoiceId: string | null;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  membershipDetails: MembershipDetails;
}

type TabType = "membership" | "payment";

export default function UserProfile() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("membership");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        setError("Error loading user data");
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-700">{error || "Unable to load user data"}</p>
      </div>
    );
  }

  const { membershipDetails } = userData;
  const membershipTypeDisplay =
    membershipDetails.membershipType === "internal"
      ? "Internal Membership"
      : "External Membership";

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
        <p className="text-blue-100">Welcome back, {userData.name}!</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("membership")}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              activeTab === "membership"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Membership
            </span>
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              activeTab === "payment"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
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
              Payment Details
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "membership" && (
          <MembershipSection userData={userData} />
        )}
        {activeTab === "payment" && (
          <PaymentDetailsSection userData={userData} />
        )}
      </div>
    </div>
  );
}
