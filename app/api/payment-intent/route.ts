import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the Payment Intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
    });
  } catch (error: any) {
    console.error("Error retrieving Payment Intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
