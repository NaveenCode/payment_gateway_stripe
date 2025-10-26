"use client";

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

interface MembershipSectionProps {
  userData: UserData;
}

export default function MembershipSection({ userData }: MembershipSectionProps) {
  const { membershipDetails } = userData;
  const membershipTypeDisplay =
    membershipDetails.membershipType.charAt(0).toUpperCase() +
    membershipDetails.membershipType.slice(1) +
    " Membership";

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Membership Information
      </h3>

      {/* Membership Type */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Membership Type
            </p>
            <p className="text-lg font-bold text-blue-700">
              {membershipTypeDisplay}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
          ACTIVE
        </div>
      </div>

      {/* Customer ID */}
      {membershipDetails.customerId && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-1">
            Stripe Customer ID
          </p>
          <p className="text-sm font-mono text-gray-800 break-all">
            {membershipDetails.customerId}
          </p>
        </div>
      )}

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-1">Name</p>
          <p className="text-gray-800 font-semibold">{userData.name}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-1">Email</p>
          <p className="text-gray-800 font-semibold break-all">
            {userData.email}
          </p>
        </div>
      </div>

      {/* No payment message */}
      {!membershipDetails.price && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-yellow-800 font-semibold">
                No payment history
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Make your first payment to activate your membership and
                unlock all features!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
