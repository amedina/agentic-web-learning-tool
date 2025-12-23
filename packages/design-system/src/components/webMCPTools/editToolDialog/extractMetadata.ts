/**
 * Internal dependencies.
 */
import type { WebMCPTool } from '../types';

export function ExtractMetadata(code: string): Partial<WebMCPTool> {
    const metadata: any = {};
    try {
        // Safe regex parsing
        const nameMatch = code.match(/name:\s*["']([^"']+)["']/);
        if (nameMatch) metadata.name = nameMatch[1];

        const nsMatch = code.match(/namespace:\s*["']([^"']+)["']/);
        if (nsMatch) metadata.namespace = nsMatch[1];

        const versionMatch = code.match(/version:\s*["']([^"']+)["']/);
        if (versionMatch) metadata.version = versionMatch[1];

        const descMatch = code.match(/description:\s*["']([^"']+)["']/);
        if (descMatch) metadata.description = descMatch[1];

        // Extract match patterns (simple array regex)
        const matchPatternsMatch = code.match(/match:\s*(\[[^\]]+\])/);
        if (matchPatternsMatch) {
            try {
                // Be careful with eval-like behavior, but JSON.parse might fail on single quotes.
                // Let's just store the string for display if parsing fails, or try a safe replace
                const arrayStr = matchPatternsMatch[1].replace(/'/g, '"');
                metadata.matchPatterns = JSON.parse(arrayStr);
            } catch (e) {
                metadata.matchPatterns = [matchPatternsMatch[1]]; // Fallback string
            }
        }

        // Extract inputSchema (block match)
        const schemaMatch = code.match(/inputSchema:\s*({[\s\S]*?})\s*}/);
        if (schemaMatch) {
            // Just keeping the string representation for UI is often safer/easier for preview
            // We can try to format it slightly
            metadata.inputSchema = schemaMatch[1];
        }

    } catch (e) {
        console.warn("Failed to extract metadata", e);
    }
    return metadata;
}
