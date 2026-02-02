import { useState, useEffect } from "react";
import {
  PenTool,
  RefreshCw,
  Sparkles,
  Loader2,
  Copy,
  AlertCircle,
  Settings2,
  ArrowRight,
  FileText,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@google-awlt/design-system";

import type {
  AIWriterTone,
  AIWriterLength,
  AIWriterFormat,
  AIRewriterTone,
  AIRewriterLength,
  AIRewriterFormat,
  AIWriter,
  AIRewriter,
} from "../../types/window.ai";

export default function WritersStudio() {
  // Mode State
  const [mode, setMode] = useState<"writer" | "rewriter">("writer");

  // Capability State
  const [capabilities, setCapabilities] = useState<{
    writer: "readily" | "after-download" | "no";
    rewriter: "readily" | "after-download" | "no";
  }>({ writer: "no", rewriter: "no" });
  const [isChecking, setIsChecking] = useState(true);

  // Configuration State
  // We use union types here to hold state for both, but we cast/validate before sending to API
  const [tone, setTone] = useState<string>("neutral");
  const [length, setLength] = useState<string>("short");
  const [format, setFormat] = useState<string>("markdown");

  const [sharedContext, setSharedContext] = useState("");

  // Input/Output State
  const [input, setInput] = useState(""); // Prompt (Writer) or Draft (Rewriter)
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCapabilities();
  }, []);

  const handleModeChange = (newMode: "writer" | "rewriter") => {
    setMode(newMode);
    if (newMode === "writer") {
      setTone("neutral");
      setLength("short");
      setFormat("markdown");
    } else {
      setTone("as-is");
      setLength("as-is");
      setFormat("as-is");
    }
    setOutput("");
    setError(null);
  };

  const checkCapabilities = async () => {
    setIsChecking(true);
    try {
      // Check Writer
      let writerStatus: "readily" | "after-download" | "no" = "no";
      if ((window as any).Writer) {
        writerStatus = "readily";
        // Try to check availability if method exists
        // @ts-ignore
        if (typeof (window as any).Writer.availability === "function") {
          // @ts-ignore
          writerStatus = await (window as any).Writer.availability();
        }
      } else if ((window as any).ai?.writer) {
        writerStatus = "readily";
        if (typeof (window as any).ai.writer.capabilities === "function") {
          const caps = await (window as any).ai.writer.capabilities();
          writerStatus = caps.available;
        }
      }

      // Check Rewriter
      let rewriterStatus: "readily" | "after-download" | "no" = "no";
      if ((window as any).Rewriter) {
        rewriterStatus = "readily";
        // @ts-ignore
        if (typeof (window as any).Rewriter.availability === "function") {
          // @ts-ignore
          rewriterStatus = await (window as any).Rewriter.availability();
        }
      } else if ((window as any).ai?.rewriter) {
        rewriterStatus = "readily";
        if (typeof (window as any).ai.rewriter.capabilities === "function") {
          const caps = await (window as any).ai.rewriter.capabilities();
          rewriterStatus = caps.available;
        }
      }

      setCapabilities({
        writer: writerStatus,
        rewriter: rewriterStatus,
      });
    } catch (e) {
      console.error("Error checking capabilities:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRun = async () => {
    if (!input.trim() || isStreaming) return;

    setError(null);
    setOutput("");
    setIsStreaming(true);

    let activeSession: AIWriter | AIRewriter | null = null;

    try {
      if (mode === "writer") {
        const options = {
          tone: tone as AIWriterTone,
          length: length as AIWriterLength,
          format: format as AIWriterFormat,
          sharedContext: sharedContext.trim() || undefined,
        };

        let writer: AIWriter;
        if ((window as any).Writer) {
          writer = await (window as any).Writer.create(options);
        } else if ((window as any).ai?.writer) {
          writer = await (window as any).ai.writer.create(options);
        } else {
          throw new Error("Writer API not found");
        }
        activeSession = writer;

        const stream = writer.writeStreaming(input);

        let fullResponse = "";
        for await (const chunk of stream) {
          if ("Writer" in window) {
            fullResponse += chunk;
          } else {
            fullResponse = chunk;
          }
          setOutput(fullResponse);
        }
      } else {
        // Rewriter
        const options = {
          tone: tone as AIRewriterTone,
          length: length as AIRewriterLength,
          format: format as AIRewriterFormat,
          sharedContext: sharedContext.trim() || undefined,
        };

        let rewriter: AIRewriter;
        if ((window as any).Rewriter) {
          rewriter = await (window as any).Rewriter.create(options);
        } else if ((window as any).ai?.rewriter) {
          rewriter = await (window as any).ai.rewriter.create(options);
        } else {
          throw new Error("Rewriter API not found");
        }
        activeSession = rewriter;

        const stream = await rewriter.rewriteStreaming(input);

        let fullResponse = "";
        for await (const chunk of stream) {
          if ("Rewriter" in window) {
            fullResponse += chunk;
          } else {
            fullResponse = chunk;
          }
          setOutput(fullResponse);
        }
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "An error occurred during generation");
      toast.error("Generation Failed", { description: err.message });
    } finally {
      if (activeSession) {
        activeSession.destroy();
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
          Verifying Writer/Rewriter API Availability...
        </p>
      </div>
    );
  }

  const capabilityStatus = capabilities[mode];
  const isAvailable = capabilityStatus !== "no";
  const needsDownload = capabilityStatus === "after-download";

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

            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Mode</Label>
              <Tabs
                value={mode}
                onValueChange={(v) =>
                  handleModeChange(v as "writer" | "rewriter")
                }
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger
                    value="writer"
                    className="flex items-center gap-2"
                  >
                    <PenTool className="w-3 h-3" /> Writer
                  </TabsTrigger>
                  <TabsTrigger
                    value="rewriter"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> Rewriter
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Options */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {mode === "writer" ? (
                      <>
                        <SelectItem value="neutral">
                          Neutral (Default)
                        </SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="as-is">As Is (Default)</SelectItem>
                        <SelectItem value="more-formal">More Formal</SelectItem>
                        <SelectItem value="more-casual">More Casual</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    {mode === "writer" ? (
                      <>
                        <SelectItem value="short">Short (Default)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="as-is">As Is (Default)</SelectItem>
                        <SelectItem value="shorter">Shorter</SelectItem>
                        <SelectItem value="longer">Longer</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {mode === "writer" ? (
                      <>
                        <SelectItem value="markdown">
                          Markdown (Default)
                        </SelectItem>
                        <SelectItem value="plain-text">Plain Text</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="as-is">As Is (Default)</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="plain-text">Plain Text</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shared Context */}
            <div className="space-y-2">
              <Label>Shared Context</Label>
              <Textarea
                placeholder="E.g. Target audience, background info..."
                value={sharedContext}
                onChange={(e) => setSharedContext(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Context provided to the model separate from the main prompt.
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Input Area */}
          <div className="flex-1 bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-[200px]">
            <div className="flex justify-between items-center">
              <Label className="text-base">
                {mode === "writer" ? "Writer Prompt" : "Draft Text to Rewrite"}
              </Label>
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
              placeholder={
                mode === "writer"
                  ? "Write a blog post about..."
                  : "Paste text here..."
              }
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
                    {mode === "writer" ? "Writing..." : "Rewriting..."}
                  </>
                ) : needsDownload ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Initialize (Download Model)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {mode === "writer" ? "Generate Content" : "Rewrite Text"}
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
                      <p>Generated content will appear here.</p>
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
