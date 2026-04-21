/**
 * External dependencies
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Accordion,
  Button,
  Input,
  InputGroup,
  Textarea,
  toast,
  ToggleSwitch,
} from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from "../../../../constants";
import type { APIKeys } from "../../../../types";

const MODEL_ENDPOINTS = {
  anthropic: "https://api.anthropic.com/v1/models",
  "open-ai": "https://api.openai.com/v1/models",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
} as const;

type SingleProviderAccordionProps = {
  provider: (typeof INITIAL_PROVIDERS)[0];
  storedData: APIKeys;
  apiKeys: Record<string, APIKeys>;
};

const createUrlAndHeaderOptions = (
  provider: keyof typeof MODEL_ENDPOINTS,
  apiKey: string,
) => {
  const url = MODEL_ENDPOINTS[provider];
  const headers: Record<string, string> = {};
  switch (provider) {
    case "open-ai":
      headers["Authorization"] = `Bearer ${apiKey}`;
      return { headers, url };
    case "gemini":
      return { headers, url: `${url}?key=${apiKey}` };
    case "anthropic":
      headers["anthropic-version"] = "2023-06-01";
      headers["X-Api-Key"] = `${apiKey}`;
      return { headers, url };
    default:
      return { headers, url };
  }
};

export default function SingleProviderAccordion({
  provider,
  storedData,
  apiKeys,
}: SingleProviderAccordionProps) {
  const [apiKey, setAPIKey] = useState<string>("");
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);
  const [inputType, setInputType] = useState<string>("password");
  const [status, setStatus] = useState<boolean>(true);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [hasSaved, setSavedStatus] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSetModelProviderDetails = useCallback(
    async (provider: string) => {
      setIsSaving(true);
      if (storedData?.apiKey !== apiKey) {
        const { url, headers } = createUrlAndHeaderOptions(
          provider as keyof typeof MODEL_ENDPOINTS,
          apiKey.trim(),
        );

        const result = await fetch(url, { headers });
        const response = await result.json();
        if (
          (response?.data && response?.data?.length > 0) ||
          (response?.models && response?.models.length > 0)
        ) {
          toast.success("API key validated successfully.");
        } else {
          toast.error("Please re-check the API key.");
          setIsSaving(false);
          return;
        }
      }
      setSavedStatus(true);
      chrome.storage.sync.set({
        apiKeys: {
          ...apiKeys,
          [provider]: {
            apiKey: apiKey.trim(),
            thinkingMode,
            status,
            systemPrompt: systemPrompt.trim(),
          },
        },
      });
      toast.success("Provider settings have been updated.");
      setIsSaving(false);
    },
    [apiKeys, apiKey, thinkingMode, status, systemPrompt, storedData?.apiKey],
  );

  useEffect(() => {
    if (storedData?.apiKey) {
      setAPIKey(storedData.apiKey);
      setThinkingMode(storedData.thinkingMode ?? false);
      setStatus(storedData.status);
      setSavedStatus(true);
      setSystemPrompt(storedData?.systemPrompt?.trim() ?? "");
    }
  }, [storedData]);

  const shouldSubmitButtonBeDisabled = useMemo(() => {
    if (!apiKey) return true;
    if (
      apiKey === storedData?.apiKey &&
      thinkingMode === storedData?.thinkingMode &&
      status === storedData?.status &&
      systemPrompt.trim() === storedData?.systemPrompt?.trim()
    ) {
      return true;
    }
    return false;
  }, [
    apiKey,
    storedData?.apiKey,
    storedData?.thinkingMode,
    storedData?.status,
    storedData?.systemPrompt,
    thinkingMode,
    status,
    systemPrompt,
  ]);

  return (
    <Accordion
      triggerText={`${provider.id}`}
      type="single"
      collapsible
      onValueChange={() => {
        if (!hasSaved) {
          setAPIKey("");
          setInputType("password");
          setSystemPrompt("");
          setThinkingMode(false);
          setSavedStatus(false);
        }
      }}
    >
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex flex-row flex-1 items-end gap-2 justify-between">
          <InputGroup label="API Key" className="w-full">
            <div className="relative">
              <Input
                type={inputType}
                value={apiKey}
                onChange={(e) => setAPIKey(e.target.value)}
                className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm"
                placeholder="Enter key.."
              />
              <ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
            </div>
          </InputGroup>
          <Button
            onClick={() =>
              setInputType((prev) =>
                prev === "password" ? "text" : "password",
              )
            }
            disabled={!apiKey}
          >
            {inputType === "password" ? "Show" : "Hide"}
          </Button>
        </div>
        <div className="flex flex-col gap-2 justify-between pr-[76px] my-2">
          <div className="w-full">
            <div className="text-[13px] font-medium text-accent-foreground">
              System Prompt
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-5 justify-between">
            <div>
              <div className="text-[13px] font-medium text-accent-foreground">
                Thinking Mode
              </div>
              <div className="text-[11px] text-amethyst-haze">
                Internal thought process before output.
              </div>
            </div>
            <ToggleSwitch
              checked={thinkingMode}
              onCheckedChange={(v) => setThinkingMode(v)}
            />
          </div>
          <div className="flex items-center gap-2 justify-between">
            <div>
              <div className="text-[13px] font-medium text-accent-foreground">
                {status === true ? "Disable Provider" : "Enable Provider"}
              </div>
              <div className="text-[11px] text-amethyst-haze">
                Availability status of the provider.
              </div>
            </div>
            <ToggleSwitch
              checked={status}
              onCheckedChange={(v) => setStatus(v)}
            />
          </div>
        </div>
        <div>
          <Button
            onClick={() => handleSetModelProviderDetails(provider.id)}
            disabled={shouldSubmitButtonBeDisabled}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {storedData?.apiKey ? "Update" : "Set"}
          </Button>
        </div>
      </div>
    </Accordion>
  );
}
