/**
 * External dependencies.
 */
import {
  useCallback,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { useScrollLock } from "@assistant-ui/react";
import { cn, Collapsible } from "@agentic-web-labs/design-system";

export const ANIMATION_DURATION = 200;
export const SHIMMER_DURATION = 1000;

/**
 * Root collapsible container that manages open/closed state and scroll lock.
 * Provides animation timing via CSS variable and prevents scroll jumps on collapse.
 */
export const ReasoningRoot: FC<
  PropsWithChildren<{
    className?: string;
  }>
> = ({ className, children }) => {
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        lockScroll();
      }
      setIsOpen(open);
    },
    [lockScroll],
  );

  return (
    <Collapsible
      ref={collapsibleRef}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn("aui-reasoning-root mb-4 w-full", className)}
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
          "--shimmer-duration": `${SHIMMER_DURATION}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </Collapsible>
  );
};

ReasoningRoot.displayName = "ReasoningRoot";
