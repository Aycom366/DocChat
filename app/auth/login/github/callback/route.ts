import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { github, lucia } from "../../../../../auth";
import { prisma } from "../../../../../db/prisma";
import { generateIdFromEntropySize, Session } from "lucia";
import { OAuth2RequestError } from "arctic";
import { authProviders } from "../../../../../lib/utils";

function setCookieFn(session: Session) {
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
}

interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("github_oauth_state")?.value ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GithubUser = await githubUserResponse.json();

    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const emails: {
      email: string;
      primary: boolean;
      verified: boolean;
      visibility: string | null;
    }[] = await emailsResponse.json();

    const primaryEmail = emails.find((email) => email.primary) ?? null;
    if (!primaryEmail) {
      return new Response("No primary email address", {
        status: 400,
      });
    }
    if (!primaryEmail.verified) {
      return new Response("Unverified email", {
        status: 400,
      });
    }

    //This is linking of Account
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: primaryEmail.email,
          mode: "insensitive",
        },
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
          email: primaryEmail.email,
          id: userId,
          image: githubUser.avatar_url,
          name: githubUser.name,
        },
      });

      await prisma.oauthAccount.create({
        data: {
          providerId: authProviders.github,
          providerUserId: githubUser.id.toString(),
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
