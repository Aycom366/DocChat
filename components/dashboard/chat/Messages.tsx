/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import queryString from "query-string";
import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { useChatContext } from "./ChatContext";
import Skeleton from "react-loading-skeleton";
import { INFINITE_QUERY_LIMIT } from "@/lib/file";
import { Message } from "./Message";
import { useIntersection } from "@mantine/hooks";

export const validator = z.object({
  limit: z.number().min(1).max(100).nullish(),

  //find the next set of messages
  cursor: z.string().nullish(),
  fileId: z.string(),
});

type queryParams = z.infer<typeof validator>;

export interface IMessageResponse {
  messages: {
    id: string;
    isUserMessage: boolean;
    createdAt: string;
    text: string;
  }[];
}

const fetchMessages = async (args: queryParams) => {
  const res = await fetch(`/api/message?${queryString.stringify(args)}`);
  return res.json() as Promise<IMessageResponse>;
};

export const Messages: React.FC<{ fileId: string }> = ({ fileId }) => {
  const { isLoading } = useChatContext();
  const queryParams = useInfiniteQuery({
    queryKey: ["fileMessages", fileId],
    initialPageParam: {
      fileId,
      cursor: undefined,
      limit: INFINITE_QUERY_LIMIT,
    },
    queryFn: ({ pageParam }) => fetchMessages(pageParam),
    getNextPageParam: (lastPage: any) => {
      //This will prevent the next page from being fetched if there's no cursor again
      if (!lastPage.nextCursor) {
        return undefined;
      }

      return {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
        cursor: lastPage.nextCursor,
      };
    },
  });

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (
      entry?.isIntersecting &&
      !queryParams.isFetchingNextPage &&
      queryParams.hasNextPage
    ) {
      queryParams.fetchNextPage();
    }
  }, [
    entry,
    queryParams.fetchNextPage,
    queryParams.hasNextPage,
    queryParams.isFetchingNextPage,
  ]);

  const messages = useMemo(() => {
    return queryParams.data?.pages.flatMap((page) => page.messages);
  }, [queryParams]);

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    id: "loading-message",
    isUserMessage: false,
    text: (
      <span className='flex h-full items-center justify-center'>
        <Loader2 className='h-4 w-4 animate-spin' />
      </span>
    ),
  };

  const combinedMessages = useMemo(() => {
    return [
      ...(isLoading || queryParams.isLoading ? [loadingMessage] : []),
      ...(messages ?? []),
    ];
  }, [isLoading, queryParams.isLoading, messages]);

  return (
    <div className='flex max-h-[calc(100dvh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage;

          if (i === combinedMessages.length - 1) {
            return (
              <Message
                ref={ref}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message?.id}
              />
            );
          } else
            return (
              <Message
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message?.id}
              />
            );
        })
      ) : isLoading || queryParams.isFetching ? (
        <div className='w-full flex flex-col gap-2'>
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
        </div>
      ) : (
        <div className='flex-1 flex flex-col items-center justify-center gap-2'>
          <MessageSquare className='h-8 w-8 text-blue-500' />
          <h3 className='font-semibold text-xl'>You&apos;re all set!</h3>
          <p className='text-zinc-500 text-sm'>
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};
