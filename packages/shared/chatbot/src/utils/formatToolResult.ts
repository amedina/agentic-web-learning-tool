/**
 * External Dependencies
 */
import {
  CallToolResultSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '@google-awlt/common';

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
  const images = nonStructuredContent.filter((part) => part.type === 'image');
  if (images.length > 0) {
    const imageParts = images.map((imagePart, index) => {
      // Log for debugging purposes
      logger(
        ['error'],
        [
          `[ToolResult] Image ${index + 1}/${images.length}: ${imagePart.mimeType}, ${imagePart.data.length} bytes`,
        ]
      );

      return {
        type: 'image',
        data: imagePart.data,
        mimeType: imagePart.mimeType,
      };
    });

    // If we only have one image, return it directly object (common UI pattern)
    // Otherwise return the array of images
    return images.length === 1 ? imageParts[0] : imageParts;
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
