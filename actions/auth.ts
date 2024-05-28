"use server";

import bcryptjs from "bcryptjs";
import { ILogin } from "@/schemas/login";
import { IRegister } from "@/schemas/register";
import { prisma } from "@/db/prisma";
import { getUser } from "@/lib/user";
import { signIn, signOut } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";

export async function logout() {
  await signOut({ redirectTo: "/auth/login" });
}

export async function login(values: ILogin) {
  try {
    await signIn("credentials", {
      ...values,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials" };

        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function register(values: IRegister) {
  const hashedPassword = await bcryptjs.hash(values.password, 10);
  const existingUser = await getUser(values.email);
  if (existingUser) return { error: "User already exists!" };

  await prisma.user.create({
    data: {
      ...values,
      password: hashedPassword,
    },
  });

  return { success: "User Created, Please Login" };
}
