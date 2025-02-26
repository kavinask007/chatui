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
      let isAllowedToSignIn = await isVerfied(email_id);
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
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
      issuer: process.env.AUTH0_ISSUER!
    })
    // Credentials({
    //   credentials: {},
    //   async authorize({ email, password }: any) {
    //     const users = await getUser(email);
    //     if (users.length === 0) return null;
    //     // biome-ignore lint: Forbidden non-null assertion.
    //     const passwordsMatch = await compare(password, users[0].password!);
    //     if (!passwordsMatch) return null;
    //     return users[0] as any;
    //   },
    // }),
  ],

  // callbacks: {
  // async session({session, user}) {
  //   session.user.id = user.id
  //   return session
  // },
  // async jwt({ token, account, profile, user }) {
  //   console.log("JWT ENTERED BABYYYYYYY");
  //   console.log(token, account, profile, user);
  //   if (user) {
  //     token.id = user.id;
  //   }
  //   if (account) {
  //     token.accessToken = account.access_token;
  //     token.id = profile?.id;
  //   }
  //   console.log("JWT DONEEEEEEEEEEEEEEEEEEEEEEEEEEE");
  //   console.log(token);
  //   return token;
  // },
  // async session({ session, token }) {
  //   console.log("SEssssssssssssssssssssssssssionnnnnnnnnnnnnnnn entered");
  //   console.log(session, token);
  //   if (token.accessToken) {
  //     session.sessionToken = token.accessToken as string;
  //   }
  //   if (session.user) {
  //     session.user.id = token.id as string;
  //   }
  //   console.log("session exitttttttttttttttttttttting");
  //   console.log(session);
  //   return session;
  // },
  // },
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfigFinal);
