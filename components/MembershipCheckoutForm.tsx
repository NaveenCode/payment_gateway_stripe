"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface MembershipCheckoutFormProps {
  membershipType: string;
  price: number;
  currency: string;
}

export default function MembershipCheckoutForm({
  membershipType,
  price,
  currency,
}: MembershipCheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/membership-success?redirect=login`,
      },
    });

    if (error) {
      setMessage(error.message || "An error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">
              {membershipType === "internal"
                ? "Internal Membership"
                : "External Membership"}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              ${price}/year
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Recurring yearly subscription
          </p>
        </div>
      </div>

      <PaymentElement />

      {message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : `Pay $${price}/year`}
      </button>

      <p className="text-center text-sm text-gray-600">
        Your subscription will renew automatically each year
      </p>
    </form>
  );
}
