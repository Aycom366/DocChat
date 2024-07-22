"use server";

import bcryptjs from "bcryptjs";
import { ILogin } from "@/schemas/login";
import { IRegister } from "@/schemas/register";
import { prisma } from "@/db/prisma";
import { getUser } from "@/lib/user";
import { lucia, validateRequest } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateIdFromEntropySize } from "lucia";
import { redirect } from "next/navigation";
import type { Cookie } from "oslo/cookie";
import { cookies } from "next/headers";

import { isRedirectError } from "next/dist/client/components/redirect";

function setCookieFn(sessionCookie: Cookie) {
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
}

export async function logout() {
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  setCookieFn(sessionCookie);

  return redirect("/auth/login");
}

export async function login(values: ILogin) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: values.email,
          mode: "insensitive",
        },
      },
    });

    if (!user || !user.password)
      return { error: "Incorrect username or password" };

    const comparePassword = await bcryptjs.compare(
      values.password,
      user.password
    );

    if (!comparePassword) return { error: "Incorrect username or password" };

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    setCookieFn(sessionCookie);
    return redirect(DEFAULT_LOGIN_REDIRECT);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}

export async function register(values: IRegister) {
  const hashedPassword = await bcryptjs.hash(values.password, 10);
  const existingUser = await getUser(values.email);

  if (existingUser) return { error: "User already exists!" };

  const userId = generateIdFromEntropySize(10);

  await prisma.user.create({
    data: {
      ...values,
      id: userId,
      password: hashedPassword,
    },
  });
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookieFn(sessionCookie);
  return redirect(DEFAULT_LOGIN_REDIRECT);
}
