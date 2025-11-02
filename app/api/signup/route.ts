import { NextResponse } from "next/server";
import { addUser, emailExists } from "@/lib/users";
import connectDB from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("body", body);
    const { name, email, password } = body;
    console.log("📝 Signup attempt:", { name, email });

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();
    const existsInDB = await emailExists(email);
    if (existsInDB) {
      return NextResponse.json(
        { error: "Email already registered in database" },
        { status: 400 }
      );
    }

    console.log("💾 Creating user in MongoDB...");
    try {
      const user = await addUser(name, email, password);
      console.log(`✅ MongoDB user created: ${user.email}`);

      return NextResponse.json({
        message: "User created successfully in database",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (dbError: any) {
      console.error("❌ MongoDB user creation failed:", dbError.message);
      return NextResponse.json(
        { error: "Failed to create user in database." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
