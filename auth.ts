import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import authConfig from "./auth.config";

const prisma = new PrismaClient();

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
  callbacks: {
    // async signIn({ user }) {
    //   const existingUser = await getUser(user.email);
    //   if (!existingUser || !existingUser.emailVerified) return false;

    //   return true; //Allow the user to sign in
    // },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
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
