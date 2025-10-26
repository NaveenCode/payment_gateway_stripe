import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Connect to database and get user
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify the payment intent belongs to this user
    if (user.membershipDetails?.paymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        { error: "Payment not found or does not belong to you" },
        { status: 403 }
      );
    }

    // Retrieve the Payment Intent from Stripe with expanded charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    // Check if payment was successful
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed yet" },
        { status: 400 }
      );
    }

    // Get the charge and receipt URL
    const charge = paymentIntent.latest_charge as Stripe.Charge;
    const receiptUrl = charge?.receipt_url;

    if (!receiptUrl) {
      return NextResponse.json(
        { error: "Receipt not available yet" },
        { status: 404 }
      );
    }

    // Fetch the receipt HTML from Stripe
    const receiptResponse = await fetch(receiptUrl);

    if (!receiptResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch receipt from Stripe" },
        { status: 500 }
      );
    }

    const receiptHtml = await receiptResponse.text();

    // Return the HTML with appropriate headers for download
    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoice-${paymentIntentId}.html"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error retrieving receipt:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
