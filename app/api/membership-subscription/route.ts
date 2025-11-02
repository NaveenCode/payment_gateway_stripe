import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

async function getOrCreateProduct(
  membershipType: string
): Promise<Stripe.Product> {
  const productName =
    membershipType === "internal"
      ? "Internal Membership"
      : "External Membership";

  const productId = `membership_${membershipType}`;

  try {
    const product = await stripe.products.retrieve(productId);
    console.log(`✅ Found existing product: ${product.name}`);
    return product;
  } catch (error: any) {
    if (error.code === "resource_missing") {
      console.log(`📦 Creating new product: ${productName}`);
      const product = await stripe.products.create({
        id: productId,
        name: productName,
        description: `${productName} - Yearly Subscription`,
        metadata: {
          membershipType,
        },
      });
      console.log(`✅ Product created: ${product.id}`);
      return product;
    }
    throw error;
  }
}

async function getOrCreatePrice(
  productId: string,
  price: number,
  currency: string
): Promise<Stripe.Price> {
  const priceInCents = price * 100;

  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
    recurring: { interval: "year" },
    limit: 100,
  });

  const matchingPrice = existingPrices.data.find(
    (p) =>
      p.unit_amount === priceInCents &&
      p.currency === currency.toLowerCase() &&
      p.recurring?.interval === "year"
  );

  if (matchingPrice) {
    console.log(`✅ Found existing price: ${matchingPrice.id}`);
    return matchingPrice;
  }

  console.log(`💰 Creating new price: $${price}/year`);
  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: priceInCents,
    currency: currency.toLowerCase(),
    recurring: {
      interval: "year",
    },
    metadata: {
      membershipType: productId.replace("membership_", ""),
    },
  });
  console.log(`✅ Price created: ${newPrice.id}`);
  return newPrice;
}

export async function POST(request: Request) {
  try {
    const { email, membershipType, price, currency } = await request.json();

    if (!email || !membershipType || !price || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email });

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

    const product = await getOrCreateProduct(membershipType);
    const priceObj = await getOrCreatePrice(product.id, price, currency);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceObj.id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: user._id.toString(),
        membershipType,
      },
    });

    const latestInvoice = subscription.latest_invoice;
    let clientSecret: string | null = null;
    let paymentIntentId: string | null = null;

    if (latestInvoice && typeof latestInvoice === "object") {
      const invoice = latestInvoice as any;
      if (invoice.payment_intent && typeof invoice.payment_intent === "object") {
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent.client_secret;
        paymentIntentId = paymentIntent.id;

        // Update the payment intent with metadata
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            userId: user._id.toString(),
            membershipType,
            subscriptionId: subscription.id,
          },
        });
      }
    }

    if (!clientSecret) {
      throw new Error("Failed to create payment intent for subscription");
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
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
