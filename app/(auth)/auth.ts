// import { compare } from "bcrypt-ts";
import NextAuth, { type User, type Session, NextAuthConfig } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import { getUser } from "@/lib/db/queries";
import Auth0Provider from "next-auth/providers/auth0"
 
import { authConfig } from "./auth.config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import GoogleProvider from "next-auth/providers/google";
// import { db, accounts, sessions, users, verificationTokens } from "./schema"
const connectionString = process.env.POSTGRES_URL!;
const pool = postgres(connectionString, { max: 1 });
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { isVerfied } from "@/lib/db/queries";
import {
  accounts,
  sessions,
  user,
  verificationTokens,
  verifiedUsers,
} from "@/lib/db/schema";
export const db = drizzle(pool);
interface ExtendedSession extends Session {
  user: User;
}
export const authConfigFinal = {
  ...authConfig,
  // debug: true,
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      let email_id = user.email || "";
      console.log(email_id)
      let isAllowedToSignIn = await isVerfied(email_id);
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Clear the auth0 session cookie to allow signing in with different credentials
        if (account?.provider === 'auth0') {
          const auth0Domain = process.env.AUTH0_ISSUER;
          const clientId = process.env.AUTH0_CLIENT_ID;
          const returnTo = process.env.NEXT_AUTH_URL;
          
          // Return the Auth0 logout URL that will clear session and redirect back
          return `/api/auth/signout?error=Not authorized. Please contact administrator.&callbackUrl=${encodeURIComponent(
            `${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}/login?error=Not authorized to signin. Please contact administrator`
          )}`;
        }
        return '/login?error=Not authorized. Please contact administrator.';
      }
    },
  },
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER!,
      authorization: {
        params: {
          prompt: "login" // Force re-authentication
        }
      }
    })
  ],
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfigFinal);
