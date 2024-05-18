import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import { prisma } from "./db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
