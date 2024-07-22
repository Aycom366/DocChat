import { validateRequest } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { getUserSubscriptionPlan } from "@/actions/stripe";
import { PLANS } from "@/lib/stripe";
import { UploadStatus } from "@prisma/client";

const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

const f = createUploadthing();

const middleware = async () => {
  // This code runs on your server before upload
  const { user } = await validateRequest();
  // If you throw, the user will not be able to upload
  if (!user) throw new UploadThingError("Unauthorized");

  /**
   * This is a good place to check if the user has a subscription plan
   * because it's a server-side operation
   */
  const subscriptionPlan = await getUserSubscriptionPlan();

  // Whatever is returned here is accessible in onUploadComplete as `metadata`
  return { userId: user.id, subscriptionPlan };
};

const UpdateFile = async (status: UploadStatus, fileId: string) => {
  await prisma.file.update({
    data: {
      uploadStatus: status,
    },
    where: {
      id: fileId,
    },
  });
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    readonly type: string;
    readonly name: string;
    readonly size: number;
    readonly customId: string | null;
    readonly url: string;
    readonly key: string;
  };
}) => {
  //if file is already in database, don't create
  const isFileExist = await prisma.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

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
    // generate some pages so supabase can index.
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

    /**
     * get the subscription metadata
     */
    const { isSubscribed } = metadata.subscriptionPlan;
    const isProExceeded =
      pageAmount > PLANS.find((plan) => plan.name == "Pro")!?.pagesPerPdf;

    const isFreeExceeded =
      pageAmount > PLANS.find((plan) => plan.name == "Free")!?.pagesPerPdf;

    /**
     * checking for max page that can be uploaded for both pro and free plan
     */
    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await UpdateFile("FAILED", createdFile.id);
    } else {
      await UpdateFile("SUCCESS", createdFile.id);
    }
  } catch (error) {
    await UpdateFile("FAILED", createdFile.id);
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  freePlanPdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),

  proPlanPdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
