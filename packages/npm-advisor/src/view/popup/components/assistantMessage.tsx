/**
 * External dependencies.
 */
import React from "react";

/**
 * Assistant Message.
 */
export const AssistantMessage = ({ message }: any) => {
  const txt =
    message?.content?.[0]?.type === "text"
      ? message.content[0].text
      : message?.content || "";
  const isError =
    typeof txt === "string" &&
    (txt.includes("Error:") || txt.includes("No API key"));
  return (
    <div className="flex w-full mb-4 justify-start">
      <div
        className={`border px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm whitespace-pre-wrap break-words leading-relaxed ${
          isError
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {txt}
      </div>
    </div>
  );
};
