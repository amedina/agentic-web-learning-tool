/**
 * External dependencies.
 */
import { MessagePrimitive } from "@assistant-ui/react";

export const UserMessage = () => {
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-end">
        <div className="bg-[#c94137] text-white px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
