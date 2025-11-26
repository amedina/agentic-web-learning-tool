// MockAssistantProvider.tsx
import { type ReactNode } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";

export const MockAssistantProvider = ({
  children,
  welcomeMessage = "Hello! I am a mock assistant. How can I help you?",
  responseDelay = 500,
}: {
  children: ReactNode;
  welcomeMessage?: string;
  responseDelay?: number;
}) => {
  const runtime = useLocalRuntime({
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: [{ type: "text", text: welcomeMessage }],
      },
    ],
    onNew: async (message) => {
      // 1. You can add logic here to return different responses based on input
      // e.g., if (message.content[0].text.includes("error")) ...

      // 2. Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, responseDelay));

      // 3. Return a response (can be a string or a stream)
      return {
        content: [
          {
            type: "text",
            text: "This is a mocked response from the local runtime.",
          },
        ],
      };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};