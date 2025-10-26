"use client";

import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  amount: string;
  currency: string;
  membershipType: string;
  saveCard?: boolean;
  updatingCardId?: string | null;
}

export default function CheckoutForm({
  amount,
  currency,
  membershipType,
  saveCard = false,
  updatingCardId = null,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?save_card=${saveCard ? "true" : "false"}`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Membership Type:</span>
          <span className="font-medium text-gray-800">{membershipType}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="font-bold text-lg text-gray-800">
            {currency.toUpperCase()} {amount}
          </span>
        </div>
      </div>

      <PaymentElement
        id="payment-element"
        options={{
          layout: "tabs",
        }}
      />

      <button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
      >
        {isLoading ? "Processing..." : `Pay ${currency.toUpperCase()} ${amount}`}
      </button>

      {message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{message}</p>
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Powered by Stripe - Secure Payment Processing
      </p>
    </form>
  );
}
