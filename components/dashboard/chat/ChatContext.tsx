import { queryClient } from "@/providers/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { IMessageResponse, validator } from "./Messages";
import { z } from "zod";

type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

interface IProps {
  fileId: string;
  children: ReactNode;
}

interface IPreviousMessage {
  pageParams: z.infer<typeof validator>[];
  pages: IMessageResponse[];
}

export const ChatProvider: React.FC<IProps> = ({ children, fileId }) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * If the addMessage failed, we want to reset the textarea to the previous message
   */
  const backupMessage = useRef("");

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.body;
    },
    async onMutate({ message }) {
      backupMessage.current = message;
      setMessage("");

      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["fileMessages", fileId] });

      // Snapshot the previous value
      const previousMessages: IPreviousMessage | undefined =
        queryClient.getQueryData(["fileMessages", fileId]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["fileMessages", fileId],
        (old: IPreviousMessage) => {
          if (!old) {
            return {
              pages: [],
              pageParams: [],
            };
          }

          let newPages = [...old.pages];

          let latestPage = newPages[0]!;

          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;

          return {
            ...old,
            pages: newPages,
          };
        }
      );
      setIsLoading(true);
      return {
        previousMessages:
          previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    async onSuccess(stream) {
      setIsLoading(false);
      if (!stream) {
        return toast.error("There was a problem sending this message", {
          description: "Please refresh this page and try again",
        });
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // accumulated response
      let accResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        //The actual stream that open-ai gave us
        let chunkValue = decoder.decode(value);

        const matches = chunkValue.match(/(?<=")(.*?)(?=")/g);
        if (matches) {
          accResponse += matches.join("");
        }

        //append the chunk to the actual message in realtime
        queryClient.setQueryData(
          ["fileMessages", fileId],
          (old: IPreviousMessage) => {
            if (!old) {
              return {
                pages: [],
                pageParams: [],
              };
            }

            /**
             * Check if the ai-response message is already created
             * If it is, we don't want to create another one
             * This is to prevent multiple ai-responses from being created and displayed in the chat
             */
            let isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === "ai-response")
            );

            let updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages;

                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: "ai-response",
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                } else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === "ai-response") {
                      return {
                        ...message,
                        text: accResponse,
                      };
                    }
                    return message;
                  });
                }

                return {
                  ...page,
                  messages: updatedMessages,
                };
              }

              return page;
            });

            return { ...old, pages: updatedPages };
          }
        );
      }
    },
    onError: (err, newMessage, context) => {
      setMessage(backupMessage.current);
      queryClient.setQueryData(["fileMessages", fileId], {
        messages: context?.previousMessages ?? [],
      });
    },
    onSettled: async () => {
      setIsLoading(false);
      await queryClient.invalidateQueries({
        queryKey: ["fileMessages", fileId],
      });
    },
  });

  const addMessage = useCallback(() => {
    message !== "" && sendMessage({ message });
  }, [sendMessage, message]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  return useContext(ChatContext);
};
