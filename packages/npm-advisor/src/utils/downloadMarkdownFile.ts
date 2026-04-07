/**
 * External dependencies
 */
import type { ThreadMessage } from "@assistant-ui/react";

type ChatDataType = ThreadMessage & {
  parts: ThreadMessage["content"];
};
/**
 * Converts a JSON chat array into a Markdown string.
 * @param {Array} chatData - The array of chat message objects.
 * @returns {string} The formatted Markdown text.
 */
function generateMarkdownString(chatData: ChatDataType[]) {
  let markdown = "# Chat Transcript\n\n";

  chatData.forEach((entry) => {
    const role = entry.role;
    const parts = entry.parts;

    // Capitalize the role
    const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
    markdown += `### ${formattedRole}\n\n`;

    parts.forEach((part) => {
      if (part.type === "text" && part.text) {
        markdown += `${part.text}\n\n`;
      } else if (part.type === "reasoning" && part.text) {
        markdown += `> **Reasoning:**\n> ${part.text.replace(/\n/g, "\n> ")}\n\n`;
      }
    });

    markdown += `---\n\n`;
  });

  return markdown.trim();
}

/**
 * Generates the Markdown and triggers a browser download.
 * @param {Array} chatData - The array of chat message objects.
 * @param {string} filename - The desired name of the downloaded file.
 */
export function downloadMarkdownFile(
  chatData: ChatDataType[],
  filename = "conversation.md",
) {
  const markdownContent = generateMarkdownString(chatData);
  const blob = new Blob([markdownContent], {
    type: "text/markdown;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
