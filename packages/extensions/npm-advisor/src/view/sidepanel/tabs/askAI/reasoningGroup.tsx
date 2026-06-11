/**
 * External dependencies.
 */
import { memo, type PropsWithChildren } from "react";
import {
  useAssistantState,
  type ReasoningGroupComponent,
} from "@assistant-ui/react";

/**
 * Internal dependencies.
 */
import { ReasoningRoot } from "./reasoningRoot";
import { ReasoningTrigger } from "./reasoningTrigger";
import { ReasoningContent } from "./reasoningContent";
import { ReasoningText } from "./reasoningText";

/**
 * Collapsible wrapper that groups consecutive reasoning parts together.
 * Includes scroll lock to prevent page jumps during collapse animation.
 *
 * Pass ReasoningGroup to MessagePrimitive.Parts in thread.tsx
 *
 * @example:
 * ```tsx
 * <MessagePrimitive.Parts
 *   components={{
 *     Reasoning: Reasoning,
 *     ReasoningGroup: ReasoningGroup,
 *   }}
 * />
 * ```
 */
const ReasoningGroupImpl: ReasoningGroupComponent = ({
  children,
  startIndex,
  endIndex,
}: PropsWithChildren & {
  startIndex: number;
  endIndex: number;
}) => {
  /**
   * Detects if reasoning is currently streaming within this group's range.
   */
  const isReasoningStreaming = useAssistantState(({ message }) => {
    if (message.status?.type !== "running") return false;
    const lastIndex = message.parts.length - 1;
    if (lastIndex < 0) return false;
    const lastType = message.parts[lastIndex]?.type;
    if (lastType !== "reasoning") return false;
    return lastIndex >= startIndex && lastIndex <= endIndex;
  });

  return (
    <ReasoningRoot>
      <ReasoningTrigger active={isReasoningStreaming} />

      <ReasoningContent aria-busy={isReasoningStreaming}>
        <ReasoningText>{children}</ReasoningText>
      </ReasoningContent>
    </ReasoningRoot>
  );
};

export const ReasoningGroup = memo(ReasoningGroupImpl);
ReasoningGroup.displayName = "ReasoningGroup";
