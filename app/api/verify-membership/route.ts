import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing payment intent ID" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not successful", success: false },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = paymentIntent.metadata.userId;
    const membershipType = paymentIntent.metadata.membershipType;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in payment" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentDate = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    user.membershipDetails = {
      ...user.membershipDetails,
      membershipType: membershipType || "external",
      price: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      lastPaymentDate: currentDate,
      paymentIntentId: paymentIntent.id,
      subscriptionStatus: "active",
      currentPeriodEnd: oneYearLater,
      hasMembership: true,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Membership activated successfully",
    });
  } catch (error: any) {
    console.error("Verify membership error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
