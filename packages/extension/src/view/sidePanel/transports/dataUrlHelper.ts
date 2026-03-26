import type { ModelMessage } from 'ai';

/**
 * Converts data: URL strings in image/file message parts to Uint8Array.
 *
 * The AI SDK's `downloadAssets` step tries to fetch any image/file URL that
 * the model doesn't natively support. data: URLs fail validation because
 * `validateDownloadUrl` only allows http/https schemes. By converting them
 * to Uint8Array in-place beforehand, the SDK skips the download entirely.
 */
export function convertDataUrlToUint8Array(
  messages: ModelMessage[]
): void {
  for (const message of messages) {
    if (message.role !== 'user' || !Array.isArray(message.content)) continue;

    for (const part of message.content) {
      if (part.type === 'image' && typeof part.image === 'string') {
        const parsed = tryParseDataUrl(part.image);
        if (parsed) {
          part.image = parsed.data;
          if (!part.mediaType && parsed.mediaType) {
            part.mediaType = parsed.mediaType;
          }
        }
      }
      if (part.type === 'file' && typeof part.data === 'string') {
        const parsed = tryParseDataUrl(part.data);
        if (parsed) {
          part.data = parsed.data;
          if (!part.mediaType && parsed.mediaType) {
            part.mediaType = parsed.mediaType;
          }
        }
      }
    }
  }
}

function tryParseDataUrl(
  value: string
): { data: Uint8Array; mediaType: string | undefined } | null {
  if (!value.startsWith('data:')) return null;
  try {
    const commaIdx = value.indexOf(',');
    if (commaIdx === -1) return null;
    const header = value.slice(0, commaIdx);
    const base64Content = value.slice(commaIdx + 1);
    const mediaType = header.split(';')[0].split(':')[1] || undefined;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { data: bytes, mediaType };
  } catch {
    return null;
  }
}
