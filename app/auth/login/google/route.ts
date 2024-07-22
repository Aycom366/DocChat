import { generateState, generateCodeVerifier } from "arctic";
import { cookies } from "next/headers";
import { google } from "../../../../auth";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  cookies().set("google_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, //if we wait more than 1 minutes before redirecting, then this will not be valid
    sameSite: "lax",
  });

  cookies().set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, //if we wait more than 1 minutes before redirecting, then this will not be valid
    sameSite: "lax",
  });

  return Response.redirect(url);
}
