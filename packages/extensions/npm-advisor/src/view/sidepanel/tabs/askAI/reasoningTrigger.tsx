/**
 * External dependencies.
 */
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { type FC } from "react";
import { cn, CollapsibleTrigger } from "@agentic-web-labs/design-system";

/**
 * Trigger button for the Reasoning collapsible.
 * Composed of icons, label, and text shimmer animation when reasoning is being streamed.
 */
export const ReasoningTrigger: FC<{ active: boolean; className?: string }> = ({
  active,
  className,
}) => (
  <CollapsibleTrigger
    className={cn(
      "aui-reasoning-trigger group/trigger -mb-2 flex max-w-[75%] items-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
      className,
    )}
  >
    <BrainIcon className="aui-reasoning-trigger-icon size-4 shrink-0" />
    <span className="aui-reasoning-trigger-label-wrapper relative inline-block leading-none">
      <span>Reasoning</span>
      {active ? (
        <span
          aria-hidden
          className="aui-reasoning-trigger-shimmer pointer-events-none absolute inset-0 bg-clip-text bg-no-repeat text-transparent motion-reduce:animate-none animate-shimmer will-change-[background-position] bg-size-[200%_100%]"
        >
          Reasoning
        </span>
      ) : null}
    </span>
    <ChevronDownIcon className="aui-reasoning-trigger-chevron mt-0.5 size-4 shrink-0 transition-transform duration-(--animation-duration) ease-out group-data-[state=closed]/trigger:-rotate-90 group-data-[state=open]/trigger:rotate-0" />
  </CollapsibleTrigger>
);
