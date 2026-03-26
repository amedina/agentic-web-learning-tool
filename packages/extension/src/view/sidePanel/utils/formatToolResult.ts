/**
 * External Dependencies
 */
import {
  CallToolResultSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal Dependencies
 */
import logger from '../../../utils/logger';

/**
 * Processes the raw MCP result content into a format compatible with Assistant UI.
 * Handles single images, multiple images, and mixed content.
 */
function formatToolResult(
  content: CallToolResult['content'] | CallToolResult['structuredContent']
) {
  if (CallToolResultSchema.safeParse(content).success) {
    return content;
  }

  const nonStructuredContent = content as CallToolResult['content'];
  // 1. Handle Images
  // Convert image parts to text descriptions to avoid AI SDK trying to
  // download data: URIs when the conversation history is passed back to the
  // model via convertToModelMessages (causes AI_DownloadError).
  const images = nonStructuredContent.filter((part) => part.type === 'image');
  if (images.length > 0) {
    const imageDescriptions = images.map((imagePart, index) => {
      logger(
        ['debug'],
        [
          `[ToolResult] Image ${index + 1}/${images.length}: ${imagePart.mimeType}, ${imagePart.data.length} bytes`,
        ]
      );

      return `[Image: ${imagePart.mimeType}, ${imagePart.data.length} bytes]`;
    });

    // Return text descriptions of images along with any text content
    const textParts = nonStructuredContent
      .filter((part) => part.type === 'text')
      .map((part) => part.text);

    return [...textParts, ...imageDescriptions].join('\n');
  }

  // 2. Handle Simple Text (common case)
  if (
    nonStructuredContent.length === 1 &&
    nonStructuredContent[0].type === 'text'
  ) {
    return nonStructuredContent[0].text;
  }

  // 3. Handle Mixed/Generic Content
  const processedContent = nonStructuredContent.map((part) =>
    part.type === 'text' ? { type: 'text', text: part.text } : part
  );

  // Unwrap single text results from mixed processing
  if (processedContent.length === 1 && processedContent[0].type === 'text') {
    return processedContent[0].text;
  }

  return processedContent;
}

export default formatToolResult;
