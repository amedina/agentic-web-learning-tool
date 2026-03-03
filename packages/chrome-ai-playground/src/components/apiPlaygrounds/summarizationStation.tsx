/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  AlertCircle,
  Settings2,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Textarea,
  Label,
  Toaster,
  toast,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import type {
  AISummarizerType,
  AISummarizerFormat,
  AISummarizerLength,
  AISummarizerSession,
  AIAvailability,
} from "../../types/window";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "ja", label: "Japanese" },
] as const;

export default function SummarizationStation() {
  // Capability State
  const [availability, setAvailability] = useState<AIAvailability>("no");
  const [isChecking, setIsChecking] = useState(true);

  // Configuration State
  const [type, setType] = useState<AISummarizerType>("key-points");
  const [format, setFormat] = useState<AISummarizerFormat>("markdown");
  const [length, setLength] = useState<AISummarizerLength>("medium");
  const [outputLanguage, setOutputLanguage] = useState<string>("en");

  // Input/Output State
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    setIsChecking(true);
    try {
      let status: AIAvailability = "no";

      // Check self.Summarizer
      if (window.Summarizer) {
        status = "readily";
        if (window.Summarizer.availability) {
          status = await window.Summarizer.availability({
            outputLanguage,
          });
        }
      } else if (window.ai?.summarizer) {
        status = "readily";
        // Check capabilities if available
        if (window.ai.summarizer.capabilities) {
          const caps = await window.ai.summarizer.capabilities({
            outputLanguage,
          });
          status = caps.available;
        } else if (window.ai.summarizer.availability) {
          status = await window.ai.summarizer.availability({
            outputLanguage,
          });
        }
      }

      setAvailability(status);
    } catch (e) {
      console.error("Error checking capabilities:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const getTypeDescription = (t: AISummarizerType) => {
    switch (t) {
      case "tldr":
        return "Concise overview suitable for quick reading.";
      case "teaser":
        return "Highlights intriguing content to encourage further reading.";
      case "key-points":
        return "Key points extracted as a bulleted list.";
      case "headline":
        return "Single-sentence headline summarizing the main point.";
      default:
        return "";
    }
  };

  const handleRun = async () => {
    if (!input.trim() || isStreaming) return;

    setError(null);
    setOutput("");
    setIsStreaming(true);

    let session: AISummarizerSession | null = null;

    try {
      const options = {
        type,
        format,
        length,
        outputLanguage,
        monitor(m: EventTarget) {
          m.addEventListener("downloadprogress", (e: any) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
        },
      };

      if (window.Summarizer) {
        session = await window.Summarizer.create(options);
      } else if (window.ai?.summarizer) {
        session = await window.ai.summarizer.create(options);
      } else {
        throw new Error("Summarizer API not found");
      }

      if (!session) throw new Error("Failed to create session");

      // Try streaming first if available
      if (session.summarizeStreaming) {
        const stream = session.summarizeStreaming(input);
        let fullResponse = "";
        for await (const chunk of stream) {
          // Adapt to streaming behavior (delta vs full text) based on API source
          // Assuming window.Summarizer might use deltas similar to Writer
          // and window.ai.summarizer uses full text (safer default for new APIs)
          if ("Summarizer" in window && window.Summarizer) {
            fullResponse += chunk;
          } else {
            fullResponse = chunk;
          }
          setOutput(fullResponse);
        }
      } else {
        // Fallback to non-streaming
        const result = await session.summarize(input);
        setOutput(result);
      }
    } catch (err: any) {
      console.error("Summarization failed:", err);
      setError(err.message || "An error occurred during summarization");
      toast.error("Summarization Failed", { description: err.message });
    } finally {
      if (session) {
        session.destroy();
      }
      setIsStreaming(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Verifying Summarizer API Availability...
        </p>
      </div>
    );
  }

  const isAvailable = availability !== "no";
  const needsDownload =
    availability === "after-download" || availability === "downloadable";

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] gap-6 w-full">
      <Toaster />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Configuration Panel */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-card border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Settings2 className="w-4 h-4" />
              <span>Configuration</span>
            </div>

            {/* Options */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as AISummarizerType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="key-points">
                      Key Points (Default)
                    </SelectItem>
                    <SelectItem value="tldr">TL;DR</SelectItem>
                    <SelectItem value="teaser">Teaser</SelectItem>
                    <SelectItem value="headline">Headline</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  {getTypeDescription(type)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as AISummarizerFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown (Default)</SelectItem>
                    <SelectItem value="plain-text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Length</Label>
                <Select
                  value={length}
                  onValueChange={(v) => setLength(v as AISummarizerLength)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Output Language</Label>
                <Select
                  value={outputLanguage}
                  onValueChange={(v) => {
                    setOutputLanguage(v);
                    // Re-check capabilities for new language
                    setTimeout(checkCapabilities, 0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label} ({lang.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Input Area */}
          <div className="flex-1 bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-[200px]">
            <div className="flex justify-between items-center">
              <Label className="text-base">Content to Summarize</Label>
              {!isAvailable && (
                <span className="flex items-center gap-1 text-destructive text-xs bg-destructive/10 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" /> API Not Available
                </span>
              )}
              {needsDownload && (
                <span className="flex items-center gap-1 text-yellow-600 text-xs bg-yellow-500/10 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> Download Required
                </span>
              )}
            </div>
            <Textarea
              className="flex-1 resize-none font-mono text-sm leading-relaxed"
              placeholder="Paste article content or text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleRun}
                disabled={!input.trim() || isStreaming || !isAvailable}
                className="w-full sm:w-auto"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Summarizing...
                  </>
                ) : needsDownload ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Initialize (Download Model)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Summarize
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Area */}
          <div className="flex-[1.5] bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-[300px] relative overflow-hidden">
            <div className="flex justify-between items-center border-b pb-2">
              <Label className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" /> Result
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                disabled={!output}
                className="h-8"
              >
                <Copy className="w-3 h-3 mr-2" /> Copy
              </Button>
            </div>

            <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {output ? (
                output
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                  {error ? (
                    <div className="text-destructive flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <p className="text-center">{error}</p>
                    </div>
                  ) : (
                    <>
                      <ArrowRight className="w-8 h-8 mb-2 opacity-20" />
                      <p>Summarizer API output will appear here.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
