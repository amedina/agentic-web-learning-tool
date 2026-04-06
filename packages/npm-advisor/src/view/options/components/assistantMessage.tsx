/**
 * External dependencies.
 */
import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "@google-awlt/design-system";
/**
 * Internal dependencies.
 */
import { PackageButton } from "../../shared/components/packageButton";

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
