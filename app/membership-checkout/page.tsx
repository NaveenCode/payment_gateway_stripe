"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import MembershipCheckoutForm from "@/components/MembershipCheckoutForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  symbol: string;
  features: string[];
}

const membershipPlans: MembershipPlan[] = [
  {
    id: "internal",
    name: "Internal Membership",
    price: 99,
    currency: "usd",
    symbol: "$",
    features: [
      "Full access to dashboard",
      "Priority support",
      "Internal tools access",
      "Team collaboration",
    ],
  },
  {
    id: "external",
    name: "External Membership",
    price: 149,
    currency: "usd",
    symbol: "$",
    features: [
      "Full access to dashboard",
      "Premium support",
      "API access",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
];

export default function MembershipCheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>(
    membershipPlans[1]
  );
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handlePlanSelect = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setClientSecret("");
  };

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/membership-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipType: selectedPlan.id,
          price: selectedPlan.price,
          currency: selectedPlan.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership
          </h1>
          <p className="text-lg text-gray-600">
            Select a plan and complete your yearly membership to access the dashboard
          </p>
        </div>

        {!clientSecret ? (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl shadow-lg p-8 cursor-pointer transition-all ${
                    selectedPlan.id === plan.id
                      ? "ring-4 ring-blue-600 transform scale-105"
                      : "hover:shadow-xl"
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    {selectedPlan.id === plan.id && (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Selected
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.symbol}{plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">/year</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Billed annually
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {error && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="max-w-2xl mx-auto text-center">
              <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : `Continue with ${selectedPlan.name}`}
              </button>
              <p className="text-sm text-gray-600 mt-4">
                Secure payment powered by Stripe
              </p>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Complete Your Payment
            </h2>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <MembershipCheckoutForm
                membershipType={selectedPlan.id}
                price={selectedPlan.price}
                currency={selectedPlan.currency}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
