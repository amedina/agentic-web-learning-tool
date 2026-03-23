/**
 * External dependencies.
 */
import React from "react";

/**
 * User Message.
 */
export const UserMessage = ({ message }: any) => {
  const txt =
    message?.content?.[0]?.type === "text"
      ? message.content[0].text
      : message?.content || "";
  return (
    <div className="flex w-full mb-4 justify-end">
      <div className="bg-[#c94137] text-white px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm whitespace-pre-wrap break-words">
        {txt}
      </div>
    </div>
  );
};
