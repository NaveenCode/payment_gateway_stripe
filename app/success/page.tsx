"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PaymentDetails {
  membershipType?: string;
  membershipName?: string;
  amount?: number;
  currency?: string;
}

export default function Success() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );

  // Use useRef to prevent duplicate saves - persists across re-renders
  const cardSaveAttemptedRef = useRef(false);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      const paymentIntent = searchParams.get("payment_intent");
      const redirectStatus = searchParams.get("redirect_status");
      const saveCard = searchParams.get("save_card") === "true";

      if (!paymentIntent) {
        setError("No payment information found");
        setLoading(false);
        return;
      }

      // Stripe automatically appends these params after successful payment
      if (redirectStatus === "succeeded") {
        setPaymentStatus("succeeded");
      } else if (redirectStatus === "processing") {
        setPaymentStatus("processing");
      } else {
        setPaymentStatus("failed");
      }

      // Fetch payment intent details from our API
      try {
        const response = await fetch(
          `/api/payment-intent?payment_intent=${paymentIntent}`
        );
        if (response.ok) {
          const data = await response.json();
          setPaymentDetails({
            membershipType: data.metadata?.membershipType,
            membershipName: data.metadata?.membershipName,
            amount: data.amount,
            currency: data.currency,
          });

          // If save_card=true and payment succeeded, save the payment method
          console.log("💳 Save card check:", {
            saveCard,
            redirectStatus,
            cardSaveAttempted: cardSaveAttemptedRef.current
          });

          if (saveCard && redirectStatus === "succeeded" && !cardSaveAttemptedRef.current) {
            // Mark as attempted IMMEDIATELY to prevent any duplicate calls
            cardSaveAttemptedRef.current = true;

            try {
              console.log("💳 Attempting to save card for payment intent:", paymentIntent);
              const saveResponse = await fetch("/api/payment-methods", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentIntentId: paymentIntent,
                }),
              });

              const saveData = await saveResponse.json();

              if (saveResponse.ok) {
                console.log("✅ Card saved for future use:", saveData);
              } else {
                console.error("❌ Failed to save card:", saveData);
              }
            } catch (saveErr) {
              console.error("❌ Error saving card:", saveErr);
              // Don't fail the payment if card saving fails
            }
          } else {
            console.log("⏭️ Skipping card save - saveCard:", saveCard, "redirectStatus:", redirectStatus, "already attempted:", cardSaveAttemptedRef.current);
          }

          console.log("✅ Payment completed. Membership already updated.");
        }
      } catch (err) {
        console.error("Error fetching payment details:", err);
      }

      setLoading(false);
    };

    fetchPaymentDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === "succeeded") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase.
          </p>

          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Membership Type:</span>
                <span className="font-semibold text-gray-800">
                  {paymentDetails.membershipName || "N/A"}
                </span>
              </div>
              {paymentDetails.amount && paymentDetails.currency && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-gray-800">
                    {paymentDetails.currency.toUpperCase()}{" "}
                    {paymentDetails.amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 mb-6">
            Payment ID: {searchParams.get("payment_intent")}
          </p>

          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Make Another Payment
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-4xl font-bold text-yellow-600 mb-4">
            Payment Processing
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment is being processed. You will receive a confirmation
            email shortly.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          Something went wrong with your payment. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
