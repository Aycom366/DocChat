import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.file.create({
        data: {
          userId: metadata.userId!,
          key: file.key,
          url: `https://utfs.io/f/${file.key}.pdf`,
          name: file.name,
          uploadStatus: "PROCESSING",
        },
      });
      revalidatePath("/dashboard");
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
