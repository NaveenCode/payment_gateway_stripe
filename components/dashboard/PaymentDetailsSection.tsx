"use client";

interface MembershipDetails {
  membershipType: "internal" | "external";
  customerId: string | null;
  price: number | null;
  currency: string | null;
  lastPaymentDate: string | null;
  paymentIntentId: string | null;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  membershipDetails: MembershipDetails;
}

interface PaymentDetailsSectionProps {
  userData: UserData;
}

export default function PaymentDetailsSection({
  userData,
}: PaymentDetailsSectionProps) {
  const { membershipDetails } = userData;
  const membershipTypeDisplay =
    membershipDetails.membershipType.charAt(0).toUpperCase() +
    membershipDetails.membershipType.slice(1) +
    " Membership";

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Payment Information
      </h3>

      {membershipDetails.price ? (
        <>
          {/* Last Payment Amount */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Last Payment Amount
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {membershipDetails.currency?.toUpperCase()}{" "}
                    {membershipDetails.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                PAID
              </div>
            </div>
          </div>

          {/* Payment Date */}
          {membershipDetails.lastPaymentDate && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Payment Date
              </p>
              <p className="text-gray-800 font-semibold">
                {new Date(membershipDetails.lastPaymentDate).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(membershipDetails.lastPaymentDate).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                )}
              </p>
            </div>
          )}

          {/* Payment Intent ID */}
          {membershipDetails.paymentIntentId && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Payment Intent ID
              </p>
              <p className="text-sm font-mono text-gray-800 break-all">
                {membershipDetails.paymentIntentId}
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Membership Type:</span>
                <span className="font-semibold text-gray-800">
                  {membershipTypeDisplay}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold text-gray-800">
                  {membershipDetails.currency?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-gray-800">
                  {membershipDetails.currency?.toUpperCase()}{" "}
                  {membershipDetails.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">
                  ✓ Completed
                </span>
              </div>
            </div>
          </div>

          {/* Download Invoice Button */}
          {membershipDetails.paymentIntentId && (
            <div className="mt-6">
              <a
                href={`/api/receipt?payment_intent=${membershipDetails.paymentIntentId}`}
                download={`invoice-${membershipDetails.paymentIntentId}.html`}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Invoice
              </a>
              <p className="text-xs text-gray-500 text-center mt-2">
                Get your Stripe payment receipt
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Payment History
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't made any payments yet.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Make Your First Payment
          </a>
        </div>
      )}
    </div>
  );
}
