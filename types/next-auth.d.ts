// Extend NextAuth types to include custom fields for Keycloak and Credentials
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  // Extend the Session interface
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  // Extend the User interface
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  // Extend the JWT interface to support Keycloak and custom expiry
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    provider?: string; // "keycloak" or "credentials"
    originalExp?: number; // Custom expiry timestamp
    accessToken?: string; // Keycloak access token
    refreshToken?: string; // Keycloak refresh token
    idToken?: string; // Keycloak ID token
  }
}
