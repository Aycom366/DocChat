//https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility

import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcryptjs from "bcryptjs";

import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "./schemas/login";
import { getUser } from "./lib/user";

export default {
  providers: [
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUser(email);

          /**
           * if they created account with google or github
           * they won't have a password
           * so break out of the function
           */
          if (!user || !user.password) return null;

          const passwordMatch = bcryptjs.compareSync(password, user.password);
          if (passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
