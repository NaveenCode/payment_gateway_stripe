import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

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

    // Connect to database
    await connectDB();

    // Find user with all data including membershipDetails
    const user = await User.findOne(
      { email: session.user.email },
      { password: 0 } // Exclude password field for security
    ).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      membershipDetails: user.membershipDetails || {
        membershipType: "external",
        customerId: null,
        price: null,
        currency: null,
        lastPaymentDate: null,
        paymentIntentId: null,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
