/**
 * External dependencies.
 */
import { useState, useEffect } from "react";
import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "@google-awlt/design-system";
import { Loader2, Plus, Check } from "lucide-react";

export const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-start">
        <div className="overflow-x-auto border px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words leading-relaxed bg-white border-slate-200 text-slate-800">
          <MessagePrimitive.Parts
            components={{
              Text: (props) => (
                <MarkdownText
                  {...props}
                  components={{
                    a: ({ href, children, ...rest }) => {
                      if (href?.startsWith("package:")) {
                        const packageName = href.replace("package:", "");

                        return <PackageButton packageName={packageName} />;
                      }

                      return (
                        <a href={href} {...rest}>
                          {children}
                        </a>
                      );
                    },
                  }}
                />
              ),
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const PackageButton = ({ packageName }: { packageName: string }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);

  useEffect(() => {
    const checkBucket = (changes?: any) => {
      if (changes && !changes.comparisonBucket) return;

      chrome.storage.local.get(["comparisonBucket"], (res) => {
        const bucket: any[] = (res.comparisonBucket as any[]) || [];

        if (!Array.isArray(bucket)) return;

        const exists = bucket.some(
          (p: any) => p.packageName === packageName || p.name === packageName,
        );

        setIsAlreadyAdded(exists);
      });
    };

    checkBucket();

    chrome.storage.onChanged.addListener(checkBucket);
    return () => {
      chrome.storage.onChanged.removeListener(checkBucket);
    };
  }, [packageName]);

  const handleAdd = async () => {
    if (isAdding || isAdded || isAlreadyAdded) return;

    setIsAdding(true);

    try {
      const res = await chrome.storage.local.get(["comparisonBucket"]);

      let currentBucket = (res.comparisonBucket as Array<any>) || [];

      if (
        !currentBucket.some(
          (p: any) => p.packageName === packageName || p.name === packageName,
        )
      ) {
        const response = await chrome.runtime.sendMessage({
          type: "GET_STATS",
          packageName: packageName,
        });

        if (response && response.success) {
          currentBucket = [...currentBucket, response.data];

          await chrome.storage.local.set({ comparisonBucket: currentBucket });
        }
      }

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error("Failed to add package:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md mx-1 align-bottom shadow-sm">
      <span className="font-mono font-bold text-blue-700 text-xs">
        {packageName}
      </span>
      <button
        onClick={handleAdd}
        disabled={isAdding || isAdded || isAlreadyAdded}
        className={`flex items-center justify-center text-[10px] uppercase font-bold tracking-wider outline-none px-1.5 py-1 rounded transition-colors ${
          isAdded || isAlreadyAdded
            ? "bg-green-500 text-white"
            : isAdding
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        }`}
      >
        {isAlreadyAdded ? (
          <>
            <Check className="w-3 h-3 mr-0.5" /> In comparison
          </>
        ) : isAdded ? (
          <>
            <Check className="w-3 h-3 mr-0.5" /> Added
          </>
        ) : isAdding ? (
          <>
            <Loader2 className="w-3 h-3 mr-0.5 animate-spin" /> Wait
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 mr-0.5" /> Compare
          </>
        )}
      </button>
    </span>
  );
};
