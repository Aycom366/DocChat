/**
 * @link https:authjs.dev/getting-started/migrating-to-v5#edge-compatibility
 */
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "./routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  /**
   * There is no reason to protect the API routes
   */
  const isApiAuthRoute = apiAuthPrefix.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );
  if (isApiAuthRoute) return;

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  /**
   * If user is logged in and is trying to access a public route, Redirect them to the /dashboard
   */
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  if (isAuthRoute) {
    if (isLoggedIn)
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    else return;
  }

  /**
   *  If user is not logged in and is trying to access a protected route, Redirect them to the /auth/login
   */
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/login", nextUrl));
  }
});

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
