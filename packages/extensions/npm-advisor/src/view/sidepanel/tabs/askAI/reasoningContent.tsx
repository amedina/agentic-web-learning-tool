/**
 * External dependencies.
 */
import { type FC, type PropsWithChildren } from "react";
import { cn, CollapsibleContent } from "@agentic-web-labs/design-system";

/**
 * Internal dependencies.
 */
import { GradientFade } from "./gradientFade";

/**
 * Collapsible content wrapper that handles height expand/collapse animation.
 * Animation: Height animates up (collapse) and down (expand).
 * Also provides group context for child animations via data-state attributes.
 */
export const ReasoningContent: FC<
  PropsWithChildren<{
    className?: string;
    "aria-busy"?: boolean;
  }>
> = ({ className, children, "aria-busy": ariaBusy }) => (
  <CollapsibleContent
    className={cn(
      "aui-reasoning-content relative overflow-hidden text-sm text-muted-foreground outline-none",
      "group/collapsible-content ease-out",
      "data-[state=closed]:animate-collapsible-up",
      "data-[state=open]:animate-collapsible-down",
      "data-[state=closed]:fill-mode-forwards",
      "data-[state=closed]:pointer-events-none",
      "data-[state=open]:duration-(--animation-duration)",
      "data-[state=closed]:duration-(--animation-duration)",
      className,
    )}
    aria-busy={ariaBusy}
  >
    {children}
    <GradientFade />
  </CollapsibleContent>
);

ReasoningContent.displayName = "ReasoningContent";
