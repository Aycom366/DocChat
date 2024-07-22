// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

/**
 * User attributes returned from the database
 * @link https://lucia-auth.com/tutorials/username-and-password/nextjs-app
 */
interface DatabaseUserAttributes {
  id: string;
  email: string;
  name: string;
  image?: string;
  googleId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia, User, Session } from "lucia";
import { prisma } from "./db/prisma";
import { cache } from "react";
import { cookies } from "next/headers";
import { Google, GitHub } from "arctic";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    // this sets cookies with super long expiration
    // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    //by default we will only get the userId and no other information
    //this is returning what we need on the frontend
    //anytime we get our session, we automatically get pass this
    return {
      id: databaseUserAttributes.id,
      email: databaseUserAttributes.email,
      name: databaseUserAttributes.name,
      image: databaseUserAttributes.image,
      googleId: databaseUserAttributes.googleId,
      stripePriceId: databaseUserAttributes.stripePriceId,
      stripeCurrentPeriodEnd: databaseUserAttributes.stripeCurrentPeriodEnd,
      stripeSubscriptionId: databaseUserAttributes.stripeSubscriptionId,
      stripeCustomerId: databaseUserAttributes.stripeCustomerId,
    };
  },
});

export const google = new Google(
  process.env.GOOGLE_ID!,
  process.env.GOOGLE_SECRET!,
  `${process.env.VERCEL_URL}/api/auth/callback/google`
);

export const github = new GitHub(
  process.env.GITHUB_ID!,
  process.env.GITHUB_SECRET!
);

/**
 * @description Validate requests
Create validateRequest(). This will check for the session cookie, validate it, and set a new cookie if necessary. Make sure to catch errors when setting cookies and wrap the function with cache() to prevent unnecessary database calls.

 * @link https://lucia-auth.com/tutorials/username-and-password/nextjs-app
 */
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch {}

    return result;
  }
);
