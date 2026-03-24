import React, { useEffect, useMemo, useState } from "react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { SendHorizontal, AlertCircle } from "lucide-react";
/**
 * Internal dependencies
 */

import { transportGenerator } from "../runtime";
import type { PackageStats } from "../../../utils/getPackageStats";
import { UserMessage } from "./userMessage";
import { AssistantMessage } from "./assistantMessage";

interface AskAIProps {
  packageName: string;
  stats: PackageStats;
}

const getSystemPrompt = (stats: string) => {
  return `You are an expert Software Architect and Open-Source Dependency Advisor. Your goal is to help developers evaluate, compare, and choose the most appropriate npm packages for their projects based on empirical data and best practices.

### Contextual Awareness:
You are acting as a co-pilot while the user browses an npm package. You will evaluate the "Current Package Data" provided below. 
- **Anchor your response:** If the user asks a generic question like "Is this safe to use?" or "What are the trade-offs?", base your answer entirely on the provided CURRENT PACKAGE DATA.
- **Compare against the baseline:** When evaluating the "recommendations" array, always frame the comparison relative to the currently browsed package (e.g., "Compared to [Browsed Package], [Alternative] is 50kb smaller but has fewer active maintainers").

### Evaluation Guidelines for the Data:
1. **packageName & githubUrl**: Identify the package and provide context. 
2. **stars**: Indicates community popularity. High stars suggest a battle-tested library, but do not guarantee active maintenance.
3. **collaboratorsCount**: Reflects the "bus factor" and team health. A higher count usually indicates better long-term sustainability.
4. **lastCommitDate**: Indicates project activity. Stale packages (no commits in > 1 year) must trigger a strong warning regarding potential incompatibility.
5. **responsiveness**: Measures how quickly maintainers address issues/PRs. High responsiveness means a healthier ecosystem.
6. **securityAdvisories**: Critical metric. Flag unpatched vulnerabilities immediately and suggest alternatives.
7. **bundle**: Bundle size impact. Emphasize heavily for front-end environments. Warn against bloat.
8. **license & licenseCompatibility**: Check for legal friction. Ensure the license is compatible with standard commercial use unless specified otherwise.
9. **recommendations**: Suggested alternatives if the current package falls short in security, maintenance, or size.
10. **dependencyTree**: Reflects supply-chain risk and bloat. Favor packages with minimal/zero dependencies.

### Your Rules of Engagement:
- **Be Objective & Data-Driven**: Base your advice primarily on the provided metrics. Call out bloat or security risks immediately.
- **Highlight Trade-offs**: Emphasize differences between the current package and its recommended alternatives.
- **Prioritize Security & Maintenance**: Never recommend a package with active high-severity security advisories or a heavily abandoned repository without strong caveats.
- **Format Clearly**: Use bullet points, bold text for key metrics, and structured comparisons to make your analysis highly scannable.

### Tone:
Professional, direct, highly technical, and deeply practical. Act like a senior developer looking over a teammate's shoulder while they browse npm.

---
### CURRENT PACKAGE DATA:
\`\`\`json
${stats}
`;
};

export const AskAI: React.FC<AskAIProps> = ({ packageName, stats }) => {
  const [apiKeys, setApiKeys] = useState<{ gemini?: string; openai?: string }>(
    {},
  );

  useEffect(() => {
    chrome.storage.sync.get(["geminiApiKey", "openAIApiKey"], (res) => {
      setApiKeys({
        gemini: (res.geminiApiKey as string) || "",
        openai: (res.openAIApiKey as string) || "",
      });
    });
  }, []);

  const transport = useMemo(
    () =>
      apiKeys.gemini
        ? transportGenerator(
            "gemini",
            "gemini-pro-latest",
            {
              apiKey: apiKeys.gemini,
            },
            getSystemPrompt(JSON.stringify(stats, null, 2)),
          )
        : transportGenerator(
            "open-ai",
            "gpt-4o",
            { apiKey: apiKeys.openai },
            getSystemPrompt(JSON.stringify(stats, null, 2)),
          ),
    [apiKeys, stats],
  );

  const runtime = useChatRuntime({
    transport,
  });

  transport.setRuntime(runtime);

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL("options/options.html"));
  };

  const suggestions = [
    {
      text: "Suggest better alternatives",
      prompt: `Suggest better alternatives to ${packageName}`,
    },
    {
      text: "Compare with [Popular Library]",
      prompt: `Compare ${packageName} with a popular alternative library`,
    },
    {
      text: "Is there a native JS way?",
      prompt: `Is there a native vanilla JavaScript way to do what ${packageName} does?`,
    },
    {
      text: `Why use this over [X]?`,
      prompt: `Why should I use ${packageName} over other options?`,
    },
  ];

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full w-full flex flex-col relative bg-slate-50">
        <ThreadPrimitive.Root className="h-full flex flex-col">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto w-full p-4 flex flex-col scroll-smooth">
            <ThreadPrimitive.Empty>
              <div className="flex flex-col items-center justify-center text-center px-4 w-full h-full space-y-4 m-auto">
                <h2 className="text-xl font-bold text-slate-800">
                  Ask AI about {packageName}
                </h2>
                <p className="text-sm text-slate-500 max-w-[80%]">
                  Hello! I can help you with questions about {packageName}. What
                  would you like to know?
                </p>
                <div className="flex flex-wrap gap-2 justify-center w-full mt-6">
                  {suggestions.map((s, i) => (
                    <ThreadPrimitive.Suggestion
                      key={i}
                      prompt={s.prompt}
                      className="bg-white border rounded-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                      method="replace"
                      autoSend
                    >
                      <span>{s.text}</span>
                    </ThreadPrimitive.Suggestion>
                  ))}
                </div>
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ThreadPrimitive.Viewport>

          <div className="p-3 bg-white border-t border-slate-200">
            {!apiKeys.gemini && !apiKeys.openai ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-200 mb-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>Missing API Key</span>
                </div>
                <button
                  onClick={openOptions}
                  className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded font-medium transition-colors"
                >
                  Configure
                </button>
              </div>
            ) : null}
            <ComposerPrimitive.Root className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-[#c94137]/20 focus-within:border-[#c94137] transition-all">
              <ComposerPrimitive.Input
                placeholder="Message AI..."
                className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent outline-none text-[13px] py-2 placeholder:text-slate-400 text-slate-800"
                disabled={!apiKeys.gemini && !apiKeys.openai}
              />
              <ComposerPrimitive.Send className="h-9 w-9 mb-1 flex items-center justify-center rounded-lg bg-[#c94137] hover:bg-[#b03028] text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50">
                <SendHorizontal size={16} />
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
};
