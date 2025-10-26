"use client";

interface CheckoutButtonProps {
  amount: number;
  productName: string;
}

export default function CheckoutButton({ amount, productName }: CheckoutButtonProps) {
  const handleCheckout = async () => {
    try {
      // Call your API to create checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          productName: productName,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert(error);
        return;
      }

      // Redirect to Stripe Checkout using the URL
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
    >
      Pay ${amount}
    </button>
  );
}
