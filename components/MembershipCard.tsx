"use client";

import { useEffect, useState } from "react";

interface MembershipDetails {
  membershipType: "internal" | "external";
  customerId: string | null;
  price: number | null;
  currency: string | null;
  lastPaymentDate: string | null;
  paymentIntentId: string | null;
}

interface MembershipData {
  name: string;
  email: string;
  membershipDetails: MembershipDetails;
}

export default function MembershipCard() {
  const [membershipData, setMembershipData] = useState<MembershipData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      try {
        const response = await fetch("/api/user/membership");
        if (response.ok) {
          const data = await response.json();
          setMembershipData(data);
        } else {
          setError("Failed to load membership details");
        }
      } catch (err) {
        setError("Error loading membership details");
        console.error("Error fetching membership:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipDetails();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !membershipData) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-700">{error || "Unable to load membership details"}</p>
      </div>
    );
  }

  const { membershipDetails } = membershipData;
  const membershipTypeDisplay =
    membershipDetails.membershipType === "internal"
      ? "Internal Membership"
      : "External Membership";

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
      <h2 className="text-2xl font-semibold text-black mb-4">
        Membership Details
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-gray-700 font-medium">Type:</span>
          <span className="text-blue-700 font-semibold text-lg">
            {membershipTypeDisplay}
          </span>
        </div>

        {membershipDetails.customerId && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Customer ID:</span>
            <span className="text-gray-600 text-sm font-mono">
              {membershipDetails.customerId}
            </span>
          </div>
        )}

        {membershipDetails.price !== null && membershipDetails.currency && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-gray-700 font-medium">Last Payment:</span>
            <span className="text-green-700 font-semibold">
              {membershipDetails.currency.toUpperCase()}{" "}
              {membershipDetails.price.toFixed(2)}
            </span>
          </div>
        )}

        {membershipDetails.lastPaymentDate && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Payment Date:</span>
            <span className="text-gray-600">
              {new Date(membershipDetails.lastPaymentDate).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          </div>
        )}

        {membershipDetails.paymentIntentId && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Payment ID:</span>
            <span className="text-gray-600 text-xs font-mono">
              {membershipDetails.paymentIntentId}
            </span>
          </div>
        )}

        {!membershipDetails.price && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center">
              No payment history yet. Make your first payment to activate your membership!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
