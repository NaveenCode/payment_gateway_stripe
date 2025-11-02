import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/users";

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
    maxAge: 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;

        console.log("✅ JWT created for user:", user.email);
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
