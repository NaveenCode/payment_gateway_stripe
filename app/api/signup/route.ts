import { NextResponse } from "next/server";
import { addUser, emailExists } from "@/lib/users";
import connectDB from "@/lib/mongodb";
import {
  createKeycloakUser,
  keycloakUserExists,
  deleteKeycloakUser,
} from "@/lib/keycloak-admin";

export async function POST(request: Request) {
  let keycloakUserId: string | null = null;

  try {
    // Read request body ONCE
    const { name, email, password } = await request.json();

    console.log("📝 Signup attempt:", { name, email });

    // ========== Step 1: Validate Inputs ==========
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

    // ========== Step 2: Check MongoDB for Existing User ==========
    await connectDB();
    const existsInDB = await emailExists(email);
    if (existsInDB) {
      return NextResponse.json(
        { error: "Email already registered in database" },
        { status: 400 }
      );
    }

    // ========== Step 3: Check Keycloak for Existing User ==========
    // TEMPORARILY DISABLED - Uncomment when Keycloak is deployed
    // const existsInKeycloak = await keycloakUserExists(email);
    // if (existsInKeycloak) {
    //   return NextResponse.json(
    //     { error: "Email already registered in Keycloak" },
    //     { status: 400 }
    //   );
    // }

    // ========== Step 4: Create User in Keycloak FIRST ==========
    // TEMPORARILY DISABLED - Uncomment when Keycloak is deployed
    // console.log("🔐 Creating user in Keycloak...");
    // try {
    //   keycloakUserId = await createKeycloakUser(name, email, password);
    //   console.log(`✅ Keycloak user created with ID: ${keycloakUserId}`);
    // } catch (keycloakError: any) {
    //   console.error("❌ Keycloak user creation failed:", keycloakError.message);
    //   return NextResponse.json(
    //     { error: `Keycloak error: ${keycloakError.message}` },
    //     { status: 500 }
    //   );
    // }

    // ========== Step 5: Create User in MongoDB ==========
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
      // ========== ROLLBACK: Delete Keycloak User ==========
      console.error("❌ MongoDB user creation failed:", dbError.message);
      console.log("🔄 Rolling back: Deleting Keycloak user...");

      if (keycloakUserId) {
        const deleted = await deleteKeycloakUser(keycloakUserId);
        if (deleted) {
          console.log("✅ Rollback successful: Keycloak user deleted");
        } else {
          console.error("⚠️ Rollback failed: Could not delete Keycloak user");
        }
      }

      return NextResponse.json(
        { error: "Failed to create user in database. Keycloak user rolled back." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Signup error:", error);

    // Try to rollback Keycloak user if it was created
    if (keycloakUserId) {
      console.log("🔄 Attempting rollback of Keycloak user...");
      await deleteKeycloakUser(keycloakUserId);
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
