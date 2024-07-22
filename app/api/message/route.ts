import { prisma } from "@/db/prisma";
import { openai } from "@/lib/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { INFINITE_QUERY_LIMIT } from "@/lib/file";
import { validateRequest } from "@/auth";

export const GET = async (req: NextRequest) => {
  try {
    const fileId = req.nextUrl.searchParams.get("fileId") as string;
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Number(req.nextUrl.searchParams.get("limit")) as number;

    const session = await validateRequest();
    if (!session)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const newLimit = limit ?? INFINITE_QUERY_LIMIT;

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: session?.user?.id,
      },
    });

    if (!file)
      return Response.json({ message: "File not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      take: newLimit + 1,
      where: {
        fileId,
        userId: session?.user?.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        isUserMessage: true,
        createdAt: true,
        text: true,
      },
    });

    //determine the next cursor
    let nextCursor: typeof cursor | undefined = undefined;
    if (messages.length > newLimit) {
      /**
       * If the length of the messages is greater than the limit
       * messages.pop() will return the last item in the array
       * which is the next item to be displayed
       * and the reason we can do this is because of the take(newLimit + 1)
       */
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      messages,
      nextCursor,
      hasNextPage: Boolean(nextCursor),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "An error has occured" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const session = await validateRequest();
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

  //vectorize message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PRIVATE_KEY!
  );

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
    filter: { fileId: body.fileId },
  });

  /**
   * This argument specifies the number of most similar items to return in the search results. In this case, the function will search the  vectorStore for items with vector representations most similar to body.message and return only the top 4 most similar ones.
   */
  const results = await vectorStore.similaritySearch(body.message, 4);

  //displays previous messages
  const prevMessages = await prisma.message.findMany({
    where: { fileId: body.fileId },
    orderBy: {
      createdAt: "asc",
    },
    take: 6,
  });

  // now send this to open-ai llm for a response
  const formattedPreviousMessages = prevMessages.map((message) => ({
    role: message.isUserMessage ? "user" : "assistant",
    content: message.text,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    stream: true,

    //attached all messages, for referencing
    messages: [
      {
        role: "system",
        content:
          "Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format.",
      },
      {
        role: "user",
        content: `Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
        \n----------------\n
  
        PREVIOUS CONVERSATION:
        ${formattedPreviousMessages.map((message) => {
          if (message.role === "user") return `User: ${message.content}\n`;
          return `Assistant: ${message.content}\n`;
        })}
        
        \n----------------\n
  
        CONTEXT:
        ${results.map((r) => r.pageContent).join("\n\n")} 
        
        USER INPUT: ${body.message}`,
      },
    ],
  });

  /**
   * now stream the response back to the client
   */
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await prisma.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          userId: session!.user?.id,
          fileId: body.fileId,
        },
      });
    },
  });

  return new StreamingTextResponse(stream);
};

/**
 * The first message, with the role "system", provides instructions for the assistant.
 * The second message, with the role "user", provides the context for the conversation. The context includes the previous conversation and the user's input. The assistant uses this context to generate a response.
 * The context which is the content of the pdf file passed to the assistant.
 */
