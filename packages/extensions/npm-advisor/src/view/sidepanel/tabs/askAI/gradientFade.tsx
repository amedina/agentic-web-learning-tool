/**
 * External dependencies.
 */
import { type FC } from "react";
import { cn } from "@agentic-web-labs/design-system";

/**
 * Gradient overlay that softens the bottom edge during expand/collapse animations.
 * Animation: Fades out with delay when opening and fades back in when closing.
 */
export const GradientFade: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "aui-reasoning-fade pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16",
      "animate-in fade-in-0",
      "group-data-[state=open]/collapsible-content:animate-out",
      "group-data-[state=open]/collapsible-content:fade-out-0",
      "group-data-[state=open]/collapsible-content:delay-[calc(var(--animation-duration)*0.75)]",
      "group-data-[state=open]/collapsible-content:fill-mode-forwards",
      "duration-(--animation-duration)",
      "group-data-[state=open]/collapsible-content:duration-(--animation-duration)",
      className,
    )}
  />
);
