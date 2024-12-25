// "use server"
// import NextAuth from 'next-auth';

// import { authConfig} from '@/app/(auth)/auth.config';
// // export { auth as middleware } from "@/app/(auth)/auth"
// export default NextAuth(authConfig).auth;

// export const config = {
//   matcher: ['/', '/:id', '/api/:path*', '/login', '/register',"/"],
//   // matcher:[]
// };
// Example of default export
export default function middleware(request:any) {
  // Middleware logic
}