"use client";

import { useState, useEffect } from "react";

interface SavedPaymentMethod {
  paymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault?: boolean;
  savedAt: Date;
}

interface SavedCardsProps {
  onSelectCard: (paymentMethodId: string) => void;
  selectedCardId: string | null;
  onUpdateCard?: (paymentMethodId: string) => void;
}

export default function SavedCards({ onSelectCard, selectedCardId, onUpdateCard }: SavedCardsProps) {
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setSavedCards(data.paymentMethods || []);
      } else {
        setError("Failed to load saved cards");
      }
    } catch (err) {
      console.error("Error fetching saved cards:", err);
      setError("Error loading saved cards");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch("/api/payment-methods", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId,
          isDefault: true,
        }),
      });

      if (response.ok) {
        // Update local state
        setSavedCards(
          savedCards.map((card) => ({
            ...card,
            isDefault: card.paymentMethodId === paymentMethodId,
          }))
        );
      } else {
        alert("Failed to set card as default");
      }
    } catch (err) {
      console.error("Error setting default card:", err);
      alert("Error setting default card");
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/payment-methods?payment_method_id=${paymentMethodId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSavedCards(savedCards.filter((card) => card.paymentMethodId !== paymentMethodId));
        if (selectedCardId === paymentMethodId) {
          onSelectCard("");
        }
      } else {
        alert("Failed to delete card");
      }
    } catch (err) {
      console.error("Error deleting card:", err);
      alert("Error deleting card");
    }
  };

  const getCardColor = (brand: string) => {
    const brandLower = brand.toLowerCase();

    if (brandLower === "visa") return "from-blue-600 to-blue-700";
    if (brandLower === "mastercard") return "from-red-600 to-orange-600";
    if (brandLower === "amex") return "from-blue-800 to-blue-900";
    if (brandLower === "discover") return "from-orange-500 to-orange-600";
    if (brandLower === "diners") return "from-gray-700 to-gray-800";
    if (brandLower === "jcb") return "from-green-600 to-green-700";
    if (brandLower === "unionpay") return "from-red-700 to-red-800";

    return "from-gray-700 to-gray-900";
  };

  const getBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();

    if (brandLower === "visa") {
      return (
        <div className="text-white font-bold text-xs">VISA</div>
      );
    } else if (brandLower === "mastercard") {
      return (
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-orange-500 -ml-1"></div>
        </div>
      );
    } else if (brandLower === "amex") {
      return (
        <div className="text-white font-bold text-xs">AMEX</div>
      );
    } else if (brandLower === "discover") {
      return (
        <div className="text-white font-bold text-xs">DISC</div>
      );
    } else if (brandLower === "diners") {
      return (
        <div className="text-white font-bold text-xs">DC</div>
      );
    } else if (brandLower === "jcb") {
      return (
        <div className="text-white font-bold text-xs">JCB</div>
      );
    } else if (brandLower === "unionpay") {
      return (
        <div className="text-white font-bold text-xs">UP</div>
      );
    }

    return (
      <div className="text-white font-bold text-xs">{brand.substring(0, 4).toUpperCase()}</div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading saved cards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (savedCards.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
        <p className="text-sm text-gray-600">No saved cards yet</p>
        <p className="text-xs text-gray-500 mt-1">Your cards will be saved after payment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">Select a saved card:</p>
        <p className="text-xs text-gray-500">{savedCards.length} card{savedCards.length > 1 ? "s" : ""}</p>
      </div>

      {savedCards.map((card) => (
        <div
          key={card.paymentMethodId}
          className={`relative flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedCardId === card.paymentMethodId
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-300"
          }`}
          onClick={() => onSelectCard(card.paymentMethodId)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 bg-gradient-to-br ${getCardColor(card.brand)} rounded flex items-center justify-center`}>
              {getBrandIcon(card.brand)}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-gray-800">
                {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
              </div>
              <div className="text-sm text-gray-600">
                Expires {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
              </div>
            </div>

            {card.isDefault && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                DEFAULT
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-3">
            {!card.isDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetAsDefault(card.paymentMethodId);
                }}
                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                title="Set as default"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            )}

            {onUpdateCard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateCard(card.paymentMethodId);
                }}
                className="text-purple-600 hover:text-purple-700 p-2 hover:bg-purple-50 rounded-full transition-colors"
                title="Update card"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCard(card.paymentMethodId);
              }}
              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Delete card"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {selectedCardId === card.paymentMethodId && (
            <div className="absolute -top-2 -right-2">
              <div className="bg-blue-600 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
