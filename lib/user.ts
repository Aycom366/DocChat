import { prisma } from "@/db/prisma";

export const getUser = async (
  value: string | undefined | null,
  field: "email" | "id" = "email"
) => {
  try {
    if (!value) return null;
    const where = field === "email" ? { email: value } : { id: value };
    return await prisma.user.findUnique({ where });
  } catch (error) {
    return null;
  }
};
