/**
 * External dependencies.
 */
import { memo } from "react";
import { type ReasoningMessagePartComponent } from "@assistant-ui/react";
import { MarkdownText } from "@agentic-web-labs/design-system";

/**
 * Internal dependencies.
 */
export { ReasoningGroup } from "./reasoningGroup";

/**
 * Renders a single reasoning part's text with markdown support.
 * Consecutive reasoning parts are automatically grouped by ReasoningGroup.
 *
 * Pass Reasoning to MessagePrimitive.Parts in thread.tsx
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
const ReasoningImpl: ReasoningMessagePartComponent = () => <MarkdownText />;

export const Reasoning = memo(ReasoningImpl);
Reasoning.displayName = "Reasoning";
