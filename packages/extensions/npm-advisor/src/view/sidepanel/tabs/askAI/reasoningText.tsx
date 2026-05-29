/**
 * External dependencies.
 */
import { type FC, type PropsWithChildren } from "react";
import { cn } from "@agentic-web-labs/design-system";

/**
 * Text content wrapper that animates the reasoning text visibility.
 * Animation: Slides in from top + fades in when opening, reverses when closing.
 * Reacts to parent ReasoningContent's data-state via Radix group selectors.
 */
export const ReasoningText: FC<
  PropsWithChildren<{
    className?: string;
  }>
> = ({ className, children }) => (
  <div
    className={cn(
      "aui-reasoning-text relative z-0 space-y-4 pt-4 pl-6 leading-relaxed",
      "transform-gpu transition-[transform,opacity]",
      "group-data-[state=open]/collapsible-content:animate-in",
      "group-data-[state=closed]/collapsible-content:animate-out",
      "group-data-[state=open]/collapsible-content:fade-in-0",
      "group-data-[state=closed]/collapsible-content:fade-out-0",
      "group-data-[state=open]/collapsible-content:slide-in-from-top-4",
      "group-data-[state=closed]/collapsible-content:slide-out-to-top-4",
      "group-data-[state=open]/collapsible-content:duration-(--animation-duration)",
      "group-data-[state=closed]/collapsible-content:duration-(--animation-duration)",
      "[&_p]:-mb-2",
      className,
    )}
  >
    <div className="absolute z-[10] left-[10px] bg-border w-[1px] h-full" />
    {children}
  </div>
);

ReasoningText.displayName = "ReasoningText";
