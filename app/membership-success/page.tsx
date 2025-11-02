"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MembershipSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");

    if (!paymentIntent) {
      setStatus("error");
      setMessage("No payment information found");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `/api/verify-membership?payment_intent=${paymentIntent}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage("Your membership is now active! Redirecting to login...");

          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Payment verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify payment");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-600">Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome Aboard!
            </h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <Link
              href="/membership-checkout"
              className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
