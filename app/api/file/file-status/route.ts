import { auth } from "@/auth";
import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: {
      userId: session?.user?.id,
      id: fileId,
    },
  });

  if (!file) return Response.json({ status: "PENDING" as const });

  return Response.json({ status: file?.uploadStatus });
}
