// ============================================================================
// Keycloak Admin Client Service
// ============================================================================
/**
 * This service handles Keycloak user management operations
 *
 * Features:
 * - Create users in Keycloak
 * - Check if user exists in Keycloak
 * - Delete users from Keycloak (for rollback)
 * - Automatic admin authentication
 */
// ============================================================================

import KcAdminClient from "@keycloak/keycloak-admin-client";

// ============================================================================
// Keycloak Admin Client Instance
// ============================================================================

let kcAdminClient: KcAdminClient | null = null;

/**
 * Get authenticated Keycloak Admin Client
 * Implements singleton pattern with automatic re-authentication
 */
async function getKeycloakAdminClient(): Promise<KcAdminClient> {
  // Always create a fresh instance to avoid realm caching issues
  kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: "master", // Admin authentication MUST use master realm
  });

  try {
    // Authenticate with admin credentials against master realm
    await kcAdminClient.auth({
      grantType: "password",
      clientId: "admin-cli",
      username: process.env.KEYCLOAK_ADMIN_USERNAME || "admin",
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin",
    });

    console.log("✅ Keycloak Admin Client authenticated with master realm");
  } catch (error: any) {
    console.error("❌ Keycloak Admin authentication failed:");
    console.error("   Error:", error.message);
    console.error("   URL:", process.env.KEYCLOAK_URL);
    console.error("   Username:", process.env.KEYCLOAK_ADMIN_USERNAME || "admin");
    throw new Error("Failed to authenticate with Keycloak Admin API");
  }

  return kcAdminClient;
}

// ============================================================================
// User Management Functions
// ============================================================================

/**
 * Create a new user in Keycloak
 *
 * @param name - User's full name
 * @param email - User's email address
 * @param password - User's password (plain text, Keycloak will handle storage)
 * @returns Keycloak user ID
 * @throws Error if user creation fails
 */
export async function createKeycloakUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  try {
    // Get authenticated admin client (authenticated against master realm)
    const adminClient = await getKeycloakAdminClient();

    // Get the target realm name
    const targetRealm = process.env.KEYCLOAK_REALM || "nextjs-realm";

    console.log(`🔐 Creating Keycloak user: ${email} in realm: ${targetRealm}`);

    // Switch to application realm for user operations
    adminClient.setConfig({
      realmName: targetRealm,
    });

    // Step 1: Check if user already exists
    const existingUsers = await adminClient.users.find({
      email: email.toLowerCase(),
      exact: true,
    });

    if (existingUsers && existingUsers.length > 0) {
      console.log("❌ User already exists in Keycloak:", email);
      throw new Error("User already exists in Keycloak");
    }

    // Step 2: Create user in Keycloak
    const createdUser = await adminClient.users.create({
      username: email.toLowerCase(), // Use email as username
      email: email.toLowerCase(),
      firstName: name.split(" ")[0], // First word of name
      lastName: name.split(" ").slice(1).join(" ") || "", // Rest of name
      enabled: true,
      emailVerified: true, // Auto-verify for testing (change in production)
    });

    // createdUser is an object with an 'id' property
    const userId = createdUser.id;

    if (!userId) {
      throw new Error("Failed to get user ID from Keycloak");
    }

    console.log(`✅ Keycloak user created with ID: ${userId}`);

    // Step 3: Set password for the user
    await adminClient.users.resetPassword({
      id: userId,
      credential: {
        temporary: false, // Password is permanent
        type: "password",
        value: password,
      },
    });

    console.log(`✅ Password set for Keycloak user: ${email}`);

    return userId;
  } catch (error: any) {
    console.error("❌ Keycloak user creation failed:");
    console.error("   Message:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    throw error;
  }
}

/**
 * Check if a user exists in Keycloak by email
 *
 * @param email - User's email address
 * @returns true if user exists, false otherwise
 */
export async function keycloakUserExists(email: string): Promise<boolean> {
  try {
    const adminClient = await getKeycloakAdminClient();

    // Switch to application realm
    adminClient.setConfig({
      realmName: process.env.KEYCLOAK_REALM || "nextjs-realm",
    });

    const users = await adminClient.users.find({
      email: email.toLowerCase(),
      exact: true,
    });

    return users && users.length > 0;
  } catch (error) {
    console.error("❌ Error checking Keycloak user existence:", error);
    return false;
  }
}

/**
 * Delete a user from Keycloak (for rollback scenarios)
 *
 * @param userId - Keycloak user ID
 * @returns true if deletion successful, false otherwise
 */
export async function deleteKeycloakUser(userId: string): Promise<boolean> {
  try {
    const adminClient = await getKeycloakAdminClient();

    // Switch to application realm
    adminClient.setConfig({
      realmName: process.env.KEYCLOAK_REALM || "nextjs-realm",
    });

    await adminClient.users.del({
      id: userId,
    });

    console.log(`✅ Deleted Keycloak user: ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting Keycloak user:", error);
    return false;
  }
}

/**
 * Get Keycloak user by email
 *
 * @param email - User's email address
 * @returns Keycloak user object or null
 */
export async function getKeycloakUserByEmail(email: string): Promise<any | null> {
  try {
    const adminClient = await getKeycloakAdminClient();

    // Switch to application realm
    adminClient.setConfig({
      realmName: process.env.KEYCLOAK_REALM || "nextjs-realm",
    });

    const users = await adminClient.users.find({
      email: email.toLowerCase(),
      exact: true,
    });

    if (users && users.length > 0) {
      return users[0];
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching Keycloak user:", error);
    return null;
  }
}
