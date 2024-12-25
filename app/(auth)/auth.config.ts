import type { NextAuthConfig } from "next-auth";

// export const authConfig = {
//   pages: {
//     signIn: '/login',
//     newUser: '/',
//   },
//   providers: [
//     // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
//     // while this file is also used in non-Node.js environments
//   ],

// callbacks: {
//   authorized({ auth, request: { nextUrl } }) {

//     const isLoggedIn = !!auth?.user;
//     console.log(auth)
//     console.log("came here ++++++++++++++?")
//     return true
//     const isOnChat = nextUrl.pathname.startsWith('/');
//     const isOnRegister = nextUrl.pathname.startsWith('/register');
//     const isOnLogin = nextUrl.pathname.startsWith('/login');
//     if (nextUrl.pathname.startsWith("/api/auth/callback/google")){
//       console.log("came here")
//       return true
//     }
//     if (isLoggedIn && (isOnLogin || isOnRegister)) {
//       console.log("**********************************")
//       console.log("redirect happening 21",nextUrl,auth)
//       console.log("**********************************")
//       return Response.redirect(new URL('/', nextUrl as unknown as URL));
//     }

//     if (isOnRegister || isOnLogin) {
//       return true; // Always allow access to register and login pages
//     }

//     if (isOnChat) {
//       if (isLoggedIn) return true;
//       console.log("**********************************")
//       console.log("redirect happening 33",nextUrl,auth)
//       console.log("**********************************")
//       return false; // Redirect unauthenticated users to login page
//     }

//     if (isLoggedIn) {
//       console.log("**********************************")
//       console.log("redirect happening 41",nextUrl)
//       console.log("**********************************")
//       return Response.redirect(new URL('/', nextUrl as unknown as URL));
//     }

//     return true;
//   },
// },
// } satisfies NextAuthConfig;

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const paths = ["/", "/chat", ""];
      return true
      if (nextUrl.pathname.startsWith("/api/auth/callback/google")) {
        console.log("came here");
        return true;
      }
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      const isProtected = paths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/login", nextUrl.origin);
        redirectUrl.searchParams.append("callbackUrl", nextUrl.href);
        return Response.redirect(redirectUrl);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
