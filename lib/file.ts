import { prisma } from "@/db/prisma";

export const getFiles = async (userId: string) => {
  const files = await prisma.file.findMany({
    where: {
      userId,
    },
  });

  return files;
};

export const getFile = async (userId: string, value: string) => {
  const file = await prisma.file.findFirst({
    where: {
      id: value,
      userId,
    },
  });

  return file;
};
