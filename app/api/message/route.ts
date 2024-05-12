import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const file = await prisma.file.findFirst({
    where: {
      id: body.fileId,
      userId: session.user.id,
    },
  });

  if (!file) return new Response("Not found", { status: 404 });

  await prisma.message.create({
    data: {
      text: body.message,
      isUserMessage: true,
      userId: session.user.id,
      fileId: body.fileId,
    },
  });
};
