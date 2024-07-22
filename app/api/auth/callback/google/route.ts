import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { google, lucia } from "../../../../../auth";
import { prisma } from "../../../../../db/prisma";
import { authProviders } from "@/lib/utils";
import { generateIdFromEntropySize, Session } from "lucia";
import { OAuth2RequestError } from "arctic";

interface GoogleResponse {
  // An identifier for the user, unique among all Google accounts and never reused. A Google account can have multiple email addresses at different points in time, but the sub value is never changed. Use sub within your application as the unique-identifier key for the user. Maximum length of 255 case-sensitive ASCII characters.
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

function setCookieFn(session: Session) {
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = cookies().get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier = cookies().get("code_verifier")?.value ?? null;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    //make a request to get user response
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    //get user
    const googleUser: GoogleResponse = await response.json();

    //This is linking of Account
    const existingUser = await prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });
    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      setCookieFn(session);

      //return a redirect to dashboard by checking headers
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard",
        },
      });
    }

    const userId = generateIdFromEntropySize(10);

    //Ensure both tables are created
    await prisma.$transaction(async (prisma) => {
      await prisma.user.create({
        data: {
          email: googleUser.email,
          id: userId,
          image: googleUser.picture,
          name: googleUser.name + " " + googleUser.family_name,
        },
      });

      await prisma.oauthAccount.create({
        data: {
          providerId: authProviders.google,
          providerUserId: googleUser.sub,
          userId,
        },
      });
    });

    const session = await lucia.createSession(userId, {});
    setCookieFn(session);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard",
      },
    });
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }

    return new Response(null, {
      status: 500,
    });
  }
}
