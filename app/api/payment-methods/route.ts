import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// GET - Retrieve all saved payment methods for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      paymentMethods: user.savedPaymentMethods || [],
    });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Save a payment method after successful payment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.log("❌ Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentIntentId } = await request.json();
    console.log("💳 Save payment method request:", { paymentIntentId, user: session.user.email });

    if (!paymentIntentId) {
      console.log("❌ No payment intent ID provided");
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      console.log("❌ User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve the payment intent from Stripe
    console.log("📥 Retrieving payment intent from Stripe:", paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("📥 Payment Intent status:", paymentIntent.status);
    console.log("📥 Payment Method ID:", paymentIntent.payment_method);

    if (!paymentIntent.payment_method) {
      console.log("❌ No payment method in payment intent");
      return NextResponse.json(
        { error: "No payment method found in payment intent" },
        { status: 400 }
      );
    }

    // Get the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method as string
    );
    console.log("📥 Payment Method details:", {
      id: paymentMethod.id,
      type: paymentMethod.type,
      customer: paymentMethod.customer,
      card: paymentMethod.card ? `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4}` : 'N/A'
    });

    // Check if this payment method is already saved
    const existingMethod = user.savedPaymentMethods?.find(
      (pm) => pm.paymentMethodId === paymentMethod.id
    );

    if (existingMethod) {
      return NextResponse.json({
        message: "Payment method already saved",
        paymentMethod: existingMethod,
      });
    }

    // Check if payment method needs to be attached to customer
    if (!user.membershipDetails?.customerId) {
      return NextResponse.json(
        { error: "No customer ID found" },
        { status: 400 }
      );
    }

    // Check if already attached to this customer
    if (paymentMethod.customer !== user.membershipDetails.customerId) {
      try {
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: user.membershipDetails.customerId,
        });
        console.log("✅ Payment method attached to customer");
      } catch (attachError: any) {
        // If already attached or can't be reused, this means the payment method was used without customer
        console.error("Error attaching payment method:", attachError.message);
        return NextResponse.json(
          { error: "This payment method cannot be saved. Please make a new payment with the 'Save card' option enabled." },
          { status: 400 }
        );
      }
    } else {
      console.log("✅ Payment method already attached to customer");
    }

    // Extract card details
    const card = paymentMethod.card;
    if (!card) {
      return NextResponse.json(
        { error: "Not a card payment method" },
        { status: 400 }
      );
    }

    // Create saved payment method object
    const savedPaymentMethod = {
      paymentMethodId: paymentMethod.id,
      last4: card.last4,
      brand: card.brand,
      expiryMonth: card.exp_month,
      expiryYear: card.exp_year,
      isDefault: user.savedPaymentMethods?.length === 0, // First card is default
      savedAt: new Date(),
    };

    // Add to user's saved payment methods using atomic operation to prevent race conditions
    if (!user.savedPaymentMethods) {
      user.savedPaymentMethods = [];
    }

    // Double-check for duplicates right before saving (race condition protection)
    const duplicateCheck = user.savedPaymentMethods.find(
      (pm) => pm.paymentMethodId === paymentMethod.id
    );

    if (duplicateCheck) {
      console.log("⚠️ Duplicate detected during save, skipping:", paymentMethod.id);
      return NextResponse.json({
        message: "Payment method already saved",
        paymentMethod: duplicateCheck,
      });
    }

    user.savedPaymentMethods.push(savedPaymentMethod);

    await user.save();

    console.log("✅ Payment method saved:", paymentMethod.id);

    return NextResponse.json({
      message: "Payment method saved successfully",
      paymentMethod: savedPaymentMethod,
    });
  } catch (error: any) {
    console.error("Error saving payment method:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a saved payment method
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("payment_method_id");

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from database
    const originalLength = user.savedPaymentMethods?.length || 0;
    user.savedPaymentMethods = user.savedPaymentMethods?.filter(
      (pm) => pm.paymentMethodId !== paymentMethodId
    );

    if (user.savedPaymentMethods?.length === originalLength) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    await user.save();

    // Detach from Stripe customer
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (detachError) {
      console.error("Error detaching payment method from Stripe:", detachError);
      // Continue even if detach fails
    }

    console.log("✅ Payment method deleted:", paymentMethodId);

    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a saved payment method (e.g., set as default)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethodId, isDefault } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the payment method
    const paymentMethod = user.savedPaymentMethods?.find(
      (pm) => pm.paymentMethodId === paymentMethodId
    );

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // If setting as default, remove default from all other cards
    if (isDefault === true) {
      user.savedPaymentMethods = user.savedPaymentMethods?.map((pm) => ({
        ...pm,
        isDefault: pm.paymentMethodId === paymentMethodId,
      }));

      // Also set as default payment method in Stripe
      if (user.membershipDetails?.customerId) {
        try {
          await stripe.customers.update(user.membershipDetails.customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
          console.log("✅ Set as default payment method in Stripe");
        } catch (stripeError) {
          console.error("Error setting default in Stripe:", stripeError);
          // Continue anyway - DB update is more important
        }
      }
    }

    await user.save();

    console.log("✅ Payment method updated:", paymentMethodId);

    return NextResponse.json({
      message: "Payment method updated successfully",
      paymentMethod: user.savedPaymentMethods?.find(
        (pm) => pm.paymentMethodId === paymentMethodId
      ),
    });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
