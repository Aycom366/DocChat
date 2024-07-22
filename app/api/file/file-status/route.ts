import { validateRequest } from "@/auth";
import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  const { user } = await validateRequest();
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: {
      userId: user?.id,
      id: fileId,
    },
  });

  if (!file) return Response.json({ status: "PENDING" as const });

  return Response.json({ status: file?.uploadStatus });
}
