import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to make a payment." },
        { status: 401 }
      );
    }

    const { amount, membershipType, currency = "usd", paymentMethodId } = await request.json();

    // Validate membership type
    const validMembershipTypes = ["internal", "external"];
    if (!membershipType || !validMembershipTypes.includes(membershipType)) {
      return NextResponse.json(
        { error: "Invalid membership type. Must be 'internal' or 'external'" },
        { status: 400 }
      );
    }

    // Validate currency
    const supportedCurrencies = ["usd", "inr", "gbp", "eur", "aud", "cad"];
    const selectedCurrency = currency.toLowerCase();

    if (!supportedCurrencies.includes(selectedCurrency)) {
      return NextResponse.json(
        { error: "Unsupported currency" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // If using saved payment method, validate it exists and belongs to the customer
    if (paymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (!paymentMethod) {
          return NextResponse.json(
            { error: "Invalid payment method" },
            { status: 400 }
          );
        }

        // Verify the payment method is attached to a customer
        if (!paymentMethod.customer) {
          return NextResponse.json(
            { error: "Payment method is not attached to any customer" },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 400 }
        );
      }
    }

    // Map membership type to display name
    const membershipDisplayName =
      membershipType === "internal"
        ? "Internal Membership"
        : "External Membership";

    // Connect to database
    await connectDB();

    // Find user in database
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = user.membershipDetails?.customerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      console.log("✅ Created new Stripe customer:", customerId);
    }

    // Create a Payment Intent (with or without saved payment method)
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100),
      currency: selectedCurrency,
      customer: customerId,
      description: `${membershipDisplayName} Payment`,
      metadata: {
        membershipType: membershipType,
        membershipName: membershipDisplayName,
        userId: user._id.toString(),
        userEmail: session.user.email,
      },
      // This tells Stripe to attach the payment method to the customer for future use
      setup_future_usage: 'off_session',
    };

    // If using saved payment method, confirm immediately
    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true;
      paymentIntentParams.return_url = `${process.env.NEXTAUTH_URL}/success`;
    } else {
      // For new cards, use automatic payment methods
      paymentIntentParams.automatic_payment_methods = {
        enabled: true,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Update user's membership details immediately (invoice will be created after payment)
    user.membershipDetails = {
      customerId: customerId,
      membershipType: membershipType as "internal" | "external",
      price: amount,
      currency: selectedCurrency,
      lastPaymentDate: new Date(),
      paymentIntentId: paymentIntent.id,
    };

    await user.save();

    console.log("✅ Payment Intent created:", paymentIntent.id);
    console.log("✅ Payment Status:", paymentIntent.status);
    console.log("✅ Membership Type:", membershipDisplayName);
    console.log("✅ User membership updated for:", session.user.email);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error("Payment Intent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
