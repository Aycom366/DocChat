"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

export async function deleteFile(userId: string, fileId: string) {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });
    if (!file) return { error: "File not found" };

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${fileId}`);

    return { success: "File deleted" };
  } catch (error) {
    return { error: "Something went wrong deleting the file" };
  }
}
