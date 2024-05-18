import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

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
      const createdFile = await prisma.file.create({
        data: {
          userId: metadata.userId!,
          key: file.key,
          url: `https://utfs.io/f/${file.key}`,
          name: file.name,
          uploadStatus: "PROCESSING",
        },
      });

      revalidatePath("/dashboard");

      try {
        // generate some pages so pinecone can index.
        const response = await fetch(`https://utfs.io/f/${file.key}`);
        const blob = await response.blob();

        //Get the pdf response to a memory
        const loader = new PDFLoader(blob);

        //Extract the page level text of the pdf
        //loading the content of each page in the PDF document into pageLevelDocs.
        let pageLevelDocs = await loader.load();
        pageLevelDocs = pageLevelDocs.map((page) => {
          return {
            ...page,
            metadata: { ...page.metadata, fileId: createdFile.id },
          };
        });

        const pageAmount = pageLevelDocs.length;

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const client = createClient(url, privateKey);

        await SupabaseVectorStore.fromDocuments(pageLevelDocs, embeddings, {
          client,
          tableName: "documents",
          queryName: "match_documents",
        });

        //update the file status to success
        await prisma.file.update({
          data: {
            uploadStatus: "SUCCESS",
          },
          where: {
            id: createdFile.id,
          },
        });
      } catch (error) {
        await prisma.file.update({
          data: {
            uploadStatus: "FAILED",
          },
          where: {
            id: createdFile.id,
          },
        });
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
