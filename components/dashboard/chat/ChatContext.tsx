import { useMutation } from "@tanstack/react-query";
import { ReactNode, createContext, useCallback, useState } from "react";

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

export const ChatProvider: React.FC<IProps> = ({ children, fileId }) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
  });

  const addMessage = useCallback(() => {
    sendMessage({ message });
  }, [sendMessage, message]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  return (
    <ChatContext.Provider
      value={{
        addMessage: () => {},
        message,
        handleInputChange: () => {},
        isLoading: false,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
