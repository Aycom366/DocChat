import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import { prisma } from "./db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * in production, auth was complaining about the host not being trusted (netlify)
   * @link https://github.com/nextauthjs/next-auth/issues/6113
   *
   * When deploying your application behind a reverse proxy, you’ll need to set AUTH_TRUST_HOST equal to true. This tells Auth.js to trust the X-Forwarded-Host header from the reverse proxy. Auth.js will automatically infer this to be true if we detect the environment variable indicating that your application is running on one of the supported hosting providers. Currently VERCEL and CF_PAGES (Cloudflare Pages) are supported.
   *
   */
  trustHost: true,

  /**
   * Because prisma doesn't support edge, and we middleware are being called on the edge
   * we need to use the PrismaAdapter to make it compatible with NextAuth
   * Also the reason why we have a auth.config.ts file
   *
   * Essentially, auth.config.ts will be used to trigger the middleware
   *
   */
  adapter: PrismaAdapter(prisma),

  /**
   * modifying the default next auth pages
   */
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  /**
   * Side Effects
   */
  events: {
    /**
     * update emailVerified to true if any of the social providers is linked
     */
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session?.user) {
        session.user.id = token?.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  session: { strategy: "jwt" },
  ...authConfig,
});
