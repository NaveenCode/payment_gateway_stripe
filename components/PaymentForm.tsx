"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import SavedCards from "./SavedCards";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface MembershipType {
  id: string;
  name: string;
  description: string;
}

const currencies: Currency[] = [
  { code: "usd", name: "US Dollar", symbol: "$" },
  { code: "inr", name: "Indian Rupee", symbol: "₹" },
  { code: "gbp", name: "British Pound", symbol: "£" },
  { code: "eur", name: "Euro", symbol: "€" },
  { code: "aud", name: "Australian Dollar", symbol: "A$" },
  { code: "cad", name: "Canadian Dollar", symbol: "C$" },
];

const membershipTypes: MembershipType[] = [
  {
    id: "internal",
    name: "Internal Membership",
    description: "For internal team members and staff",
  },
  {
    id: "external",
    name: "External Membership",
    description: "For external partners and clients",
  },
];

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function PaymentForm() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("usd");
  const [membershipType, setMembershipType] = useState<string>("internal");
  const [loading, setLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"saved" | "new">("saved");
  const [saveCard, setSaveCard] = useState<boolean>(true);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  const selectedCurrency = currencies.find((c) => c.code === currency);
  const selectedMembership = membershipTypes.find((m) => m.id === membershipType);

  const handleUpdateCard = async (paymentMethodId: string) => {
    if (!confirm("Replace this card with a new one? The old card will be deleted.")) {
      return;
    }

    // Set update mode
    setUpdatingCardId(paymentMethodId);
    setPaymentMode("new");
    setSaveCard(true); // Automatically save the new card
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // If using saved card, require selection
    if (paymentMode === "saved" && !selectedCardId) {
      alert("Please select a saved card or choose to add a new card");
      return;
    }

    setLoading(true);

    try {
      // Call your API to create Payment Intent
      const requestBody: any = {
        amount: parseFloat(amount),
        membershipType: membershipType,
        currency: currency,
      };

      // If using saved card, include payment method ID
      if (paymentMode === "saved" && selectedCardId) {
        requestBody.paymentMethodId = selectedCardId;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const { clientSecret, error, paymentIntentId, status } = await response.json();

      if (error) {
        alert(error);
        setLoading(false);
        return;
      }

      // If using saved card and payment succeeded, redirect to success
      if (paymentMode === "saved" && paymentIntentId) {
        if (status === "succeeded") {
          router.push(`/success?payment_intent=${paymentIntentId}&redirect_status=succeeded`);
        } else if (status === "requires_action") {
          // Payment requires additional authentication (3D Secure)
          alert("This payment requires additional authentication. Please use the new card flow.");
        } else {
          alert(`Payment status: ${status}. Please contact support.`);
        }
        setLoading(false);
        return;
      }

      // Set the client secret to show the payment form for new cards
      if (clientSecret) {
        setClientSecret(clientSecret);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // If we have a client secret, show the payment form
  if (clientSecret) {
    const appearance = {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#2563eb",
      },
    };

    return (
      <div className="w-full max-w-md">
        <button
          onClick={() => {
            setClientSecret(null);
            setAmount("");
          }}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          ← Back to payment details
        </button>
        <Elements
          options={{ clientSecret, appearance }}
          stripe={stripePromise}
        >
          <CheckoutForm
            amount={amount}
            currency={currency}
            membershipType={selectedMembership?.name || membershipType}
            saveCard={saveCard}
            updatingCardId={updatingCardId}
          />
        </Elements>
      </div>
    );
  }

  // Otherwise, show the initial form to collect payment details
  return (
    <form onSubmit={handleCheckout} className="w-full max-w-md space-y-6">
      <div>
        <label
          htmlFor="membershipType"
          className="block text-sm font-medium mb-2 text-black"
        >
          Membership Type
        </label>
        <div className="space-y-3">
          {membershipTypes.map((membership) => (
            <label
              key={membership.id}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                membershipType === membership.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              <input
                type="radio"
                name="membershipType"
                value={membership.id}
                checked={membershipType === membership.id}
                onChange={(e) => setMembershipType(e.target.value)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-black">
                  {membership.name}
                </div>
                <div className="text-sm text-gray-600">
                  {membership.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium mb-2 text-black"
        >
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.name} ({curr.code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium mb-2 text-black"
        >
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black text-lg">
            {selectedCurrency?.symbol}
          </span>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400"
            required
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium mb-3 text-black">
          Payment Method
        </label>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setPaymentMode("saved");
              setSelectedCardId(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              paymentMode === "saved"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Saved Cards
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentMode("new");
              setSelectedCardId(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              paymentMode === "new"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            New Card
          </button>
        </div>

        {paymentMode === "saved" && (
          <SavedCards
            onSelectCard={setSelectedCardId}
            selectedCardId={selectedCardId}
            onUpdateCard={handleUpdateCard}
          />
        )}

        {paymentMode === "new" && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Save this card for future payments
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-6">
              Your card details are securely stored by Stripe. We never see your full card number.
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
      >
        {loading
          ? "Processing..."
          : paymentMode === "saved" && selectedCardId
          ? "Pay Now"
          : `Continue to Payment`}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Powered by Stripe - Secure Payment Processing
      </p>
    </form>
  );
}
