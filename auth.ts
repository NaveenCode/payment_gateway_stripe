import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/users";
import { getKeycloakUserByEmail } from "@/lib/keycloak-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
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
      async authorize(credentials) {
        console.log("🔐 Credentials login attempt for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          const dbUser = await findUserByEmail(credentials.email);

          if (!dbUser) {
            console.log("❌ User not found in MongoDB:", credentials.email);
            return null;
          }

          if (dbUser.password !== credentials.password) {
            console.log("❌ Invalid password for:", credentials.email);
            return null;
          }

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
          } else {
            console.log("✅ User verified in both MongoDB and Keycloak");
          }

          console.log("✅ Credentials login successful:", dbUser.email);
          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
          };
        } catch (error) {
          console.error("❌ Credentials login error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 20,
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "keycloak") {
        console.log("🔐 Keycloak SSO login attempt for:", user.email);

        try {
          const dbUser = await findUserByEmail(user.email || "");

          if (!dbUser) {
            console.log("❌ SSO user not found in MongoDB:", user.email);
            console.log("💡 User must sign up first before using SSO login");
            return false;
          }

          console.log("✅ SSO user verified in MongoDB:", user.email);
          user.id = dbUser.id;

          return true;
        } catch (error) {
          console.error("❌ Error checking SSO user in database:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      const now = Math.floor(Date.now() / 1000);

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.provider = account?.provider || "credentials";

        if (account?.provider === "keycloak") {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.idToken = account.id_token;
          console.log("✅ Keycloak JWT created for user:", user.email);
          console.log("🔑 Access token stored");
        } else {
          token.originalExp = now + 60 * 20;
          console.log("✅ Credentials JWT created for user:", user.email);
        }

        console.log(
          "⏰ Login time:",
          new Date(now * 1000).toLocaleTimeString()
        );
      }

      if (token.originalExp && typeof token.originalExp === "number") {
        if (now >= token.originalExp) {
          console.log(
            "❌ JWT expired! Original exp:",
            token.originalExp,
            "Now:",
            now
          );
          console.log("🔄 Provider:", token.provider);
          return null as any;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token || !token.id) {
        return null as any;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      if (token.originalExp && typeof token.originalExp === "number") {
        session.expires = new Date(token.originalExp * 1000).toISOString();
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
