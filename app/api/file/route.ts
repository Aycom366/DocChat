import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  /**
   * if key is passed, it means we are polling to know if the file has been uploaded or not
   */
  const key = searchParams.get("key");

  /**
   * if name is passed, it means the user is trying to check if the file has been uploaded before
   * so we can return the file details if it exists
   */
  const name = searchParams.get("name");

  if (!userId || (!key && !name)) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: {
      userId,
      ...(key && { key }),
      ...(name && { name }),
    },
  });

  if (!file) {
    return Response.json({ message: "File not found" }, { status: 404 });
  }

  return Response.json(file);
}
