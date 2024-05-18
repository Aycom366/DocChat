import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const key = searchParams.get("key");

  if (!userId || !key) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: {
      userId,
      key,
    },
  });

  if (!file) {
    return Response.json({ message: "File not found" }, { status: 404 });
  }

  return Response.json(file);
}
