// ============================================================================
// NextAuth Configuration - Multi-Provider Authentication
// ============================================================================
/**
 * Authentication configuration using NextAuth.js v4
 *
 * Features:
 * - Keycloak SSO (Single Sign-On) provider
 * - Email/password credentials provider (fallback)
 * - JWT-based session management with auto-expiration
 * - Custom login page integration
 * - Automatic session timeout (20 minutes for testing)
 * - User validation and password verification
 * - Secure token handling with expiration checks
 * - Persistent login time across page refreshes
 */
// ============================================================================

import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/users";
import { getKeycloakUserByEmail } from "@/lib/keycloak-admin";

// ============================================================================
// Authentication Configuration
// ============================================================================

export const authOptions: NextAuthOptions = {
  // ========== Providers ==========
  providers: [
    // ===== Keycloak SSO Provider (Primary) =====
    // TEMPORARILY DISABLED - Uncomment when Keycloak is deployed
    // KeycloakProvider({
    //   clientId: process.env.KEYCLOAK_CLIENT_ID!,
    //   clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
    //   issuer: process.env.KEYCLOAK_ISSUER!,

    //   // Additional Keycloak configuration
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.name ?? profile.preferred_username,
    //       email: profile.email,
    //       image: profile.picture,
    //     };
    //   },
    // }),

    // ===== Credentials Provider (Fallback) =====
    CredentialsProvider({
      // Provider display name
      name: "Credentials",

      // ===== Login Form Fields =====
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your@email.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your password",
        },
      },

      // ===== Authorization Logic =====
      /**
       * AUTHORIZE Function
       * Validates user credentials and returns user object on success
       *
       * Flow:
       * 1. Validates credentials exist
       * 2. Checks user exists in BOTH MongoDB AND Keycloak
       * 3. Verifies password matches
       * 4. Returns user object or null
       *
       * @param credentials - Email and password from login form
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        console.log("🔐 Credentials login attempt for:", credentials?.email);

        // Step 1: Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          // Step 2: Find user in MongoDB database by email
          const dbUser = await findUserByEmail(credentials.email);

          // Step 3: Check if user exists in MongoDB
          if (!dbUser) {
            console.log("❌ User not found in MongoDB:", credentials.email);
            return null;
          }

          // Step 4: Verify password matches
          // NOTE: In production, use bcrypt.compare() for hashed passwords!
          if (dbUser.password !== credentials.password) {
            console.log("❌ Invalid password for:", credentials.email);
            return null;
          }

          // Step 5: Verify user also exists in Keycloak
          console.log("🔍 Checking if user exists in Keycloak...");
          const keycloakUser = await getKeycloakUserByEmail(credentials.email);

          if (!keycloakUser) {
            console.log(
              "⚠️ User exists in MongoDB but not in Keycloak:",
              credentials.email
            );
            console.log(
              "💡 User can still login with credentials, but SSO won't work"
            );
            // Allow login even if not in Keycloak (backward compatibility)
          } else {
            console.log("✅ User verified in both MongoDB and Keycloak");
          }

          // Step 6: Login SUCCESS - Return user data
          console.log("✅ Credentials login successful:", dbUser.email);
          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            // SECURITY: Never return password in the session
          };
        } catch (error) {
          console.error("❌ Credentials login error:", error);
          return null;
        }
      },
    }),
  ],

  // session: {
  //   strategy: "jwt",
  //   maxAge: 20,
  // },

  // ========== Callbacks ==========
  callbacks: {
    /**
     * SignIn Callback
     * Runs when a user attempts to sign in
     * Used to validate that Keycloak SSO users also exist in MongoDB
     *
     * @param user - User object from provider
     * @param account - Account object with provider info
     * @returns true to allow sign in, false to deny
     */
    async signIn({ user, account }) {
      // Only check for Keycloak SSO logins
      if (account?.provider === "keycloak") {
        console.log("🔐 Keycloak SSO login attempt for:", user.email);

        try {
          // Check if user exists in MongoDB
          const dbUser = await findUserByEmail(user.email || "");

          if (!dbUser) {
            console.log("❌ SSO user not found in MongoDB:", user.email);
            console.log("💡 User must sign up first before using SSO login");
            // Deny login - user needs to register first
            return false;
          }

          console.log("✅ SSO user verified in MongoDB:", user.email);
          // Update user ID to match MongoDB (important for session consistency)
          user.id = dbUser.id;

          return true;
        } catch (error) {
          console.error("❌ Error checking SSO user in database:", error);
          return false;
        }
      }

      // Allow credentials login (already validated in authorize function)
      return true;
    },

    /**
     * JWT Callback
     * Runs when JWT token is created or updated
     * Handles both Keycloak OAuth tokens and Credentials tokens
     *
     * CRITICAL: We store only ONE custom field - originalExp (expiry time)
     * This field persists across all token refreshes and is used to:
     * 1. Check if session has expired
     * 2. Display countdown timer (passed to session.expires)
     *
     * Why we don't use NextAuth's built-in exp?
     * - NextAuth overwrites exp on every refetch, resetting the timer
     * - Our custom originalExp field stays constant = accurate countdown
     *
     * @param token - The JWT token object
     * @param user - User object (only present during initial login)
     * @param account - Account object (contains provider info & OAuth tokens)
     * @returns Updated token with user data
     */
    async jwt({ token, user, account }) {
      const now = Math.floor(Date.now() / 1000);

      // ===== Initial Login - Create Token with Expiry =====
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;

        // Store provider type (keycloak or credentials)
        token.provider = account?.provider || "credentials";

        // ===== Keycloak OAuth Token Handling =====
        if (account?.provider === "keycloak") {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.idToken = account.id_token;

          // Keycloak tokens have their own expiry
          // Use Keycloak's expiry or default to 20 minutes
          token.originalExp = account.expires_at || now + 60 * 20;

          console.log("✅ Keycloak JWT created for user:", user.email);
          console.log("🔑 Access token stored");
        } else {
          // ===== Credentials Token Handling =====
          // Set custom expiry time for credentials login
          token.originalExp = now + 60 * 20;

          console.log("✅ Credentials JWT created for user:", user.email);
        }

        console.log(
          "⏰ Login time:",
          new Date(now * 1000).toLocaleTimeString()
        );
        console.log(
          "⏰ Expires at:",
          new Date(token.originalExp * 1000).toLocaleTimeString()
        );
      }

      // ===== Token Refresh - Check if Expired =====
      // This runs on every request/refetch
      if (token.originalExp && typeof token.originalExp === "number") {
        if (now >= token.originalExp) {
          // Session has expired based on original login time
          console.log(
            "❌ JWT expired! Original exp:",
            token.originalExp,
            "Now:",
            now
          );
          console.log("🔄 Provider:", token.provider);
          // Return null to invalidate the session
          return null as any;
        }
      }

      return token;
    },

    /**
     * Session Callback
     * Runs when session is accessed (e.g., getServerSession, useSession)
     * Adds user data from JWT token to the session object
     *
     * IMPORTANT: Sets session.expires from token.originalExp to ensure the
     * countdown timer uses the original login time, not refresh time.
     *
     * @param session - The session object
     * @param token - The JWT token containing user data
     * @returns Session with user data and correct expiry
     */
    async session({ session, token }) {
      // If token is invalid or expired, return null
      if (!token || !token.id) {
        return null as any;
      }

      // ===== Add User Data to Session =====
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      // ===== Set Session Expiry from ORIGINAL JWT Token Expiry =====
      // Use the expiration time we stored during initial login (originalExp)
      // This ensures the timer shows time from original login, not from refresh
      if (token.originalExp && typeof token.originalExp === "number") {
        session.expires = new Date(token.originalExp * 1000).toISOString();
      }

      return session;
    },
  },

  // ========== Custom Pages ==========
  pages: {
    signIn: "/login", // Custom login page route
  },

  // ========== Secret Key ==========
  secret: process.env.NEXTAUTH_SECRET, // Used to encrypt JWT tokens

  // ========== Debug Mode ==========
  debug: process.env.NODE_ENV === "development", // Enable detailed logging in development
};

// ============================================================================
// Export
// ============================================================================

export default authOptions;
