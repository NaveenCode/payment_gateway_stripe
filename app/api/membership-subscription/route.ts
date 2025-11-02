import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { membershipType, price, currency } = await request.json();

    if (!membershipType || !price || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.membershipDetails?.customerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;

      user.membershipDetails = {
        ...user.membershipDetails,
        customerId,
      };
      await user.save();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100,
      currency: currency.toLowerCase(),
      customer: customerId,
      setup_future_usage: "off_session",
      metadata: {
        userId: user._id.toString(),
        membershipType,
        subscriptionType: "yearly",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId,
    });
  } catch (error: any) {
    console.error("Membership subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
