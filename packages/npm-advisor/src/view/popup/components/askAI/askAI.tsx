/**
 * External dependencies.
 */
import React, {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";

/**
 * Internal dependencies
 */
import { transportGenerator } from "../../runtime";
import type { PackageStats } from "../../../../utils/getPackageStats";
import { getSystemPrompt } from "./getSystemPrompt";
import { ChatUI } from "./chatUI";

interface AskAIProps {
  packageName: string;
  stats: PackageStats;
  messages: UIMessage[];
  setDisableLock: Dispatch<SetStateAction<boolean>>;
}

export const AskAI: React.FC<AskAIProps> = ({
  packageName,
  stats,
  messages,
  setDisableLock,
}) => {
  const [apiKeys, setApiKeys] = useState<{ gemini?: string; openai?: string }>(
    {},
  );

  useEffect(() => {
    chrome.storage.sync.get(["apiKeys"], (res) => {
      const stored = (res.apiKeys ?? {}) as Record<
        string,
        { apiKey?: string; status?: boolean }
      >;
      setApiKeys({
        gemini: stored["gemini"]?.apiKey || "",
        openai: stored["open-ai"]?.apiKey || "",
      });
    });
  }, []);

  const transport = useMemo(() => {
    if (apiKeys.gemini) {
      return transportGenerator(
        "gemini",
        "gemini-pro-latest",
        {
          apiKey: apiKeys.gemini,
        },
        getSystemPrompt(JSON.stringify(stats, null, 2)),
      );
    }

    return transportGenerator(
      "open-ai",
      "gpt-4o",
      { apiKey: apiKeys.openai },
      getSystemPrompt(JSON.stringify(stats, null, 2)),
    );
  }, [apiKeys, stats]);

  const runtime = useChatRuntime({
    messages,
    transport,
  });

  transport.setRuntime(runtime);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatUI
        packageName={packageName}
        apiKeys={apiKeys}
        setDisableLock={setDisableLock}
      />
    </AssistantRuntimeProvider>
  );
};
