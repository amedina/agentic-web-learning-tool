/**
 * External dependencies.
 */
import { type TextMessagePartComponent } from "@assistant-ui/react";
import { MarkdownText } from "@agentic-web-labs/design-system";

/**
 * Internal dependencies.
 */
import { PackageButton } from "./packageButton";

/**
 * MarkdownText renderer for assistant message bodies. Renders `package:<name>`
 * links as inline PackageButton chips so the model can surface clickable
 * package references, and falls back to a normal anchor for any other href.
 */
export const MarkdownMessageText: TextMessagePartComponent = (props) => (
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
);
