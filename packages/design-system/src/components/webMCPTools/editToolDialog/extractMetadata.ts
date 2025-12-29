/**
 * Internal dependencies.
 */
import type { WebMCPTool } from '../types';

export function ExtractMetadata(code: string): Partial<WebMCPTool> {
    const metadata: any = {};
    try {
        const nameMatch = code.match(/name:\s*["']([^"']+)["']/);
        if (nameMatch) metadata.name = nameMatch[1];

        const nsMatch = code.match(/namespace:\s*["']([^"']+)["']/);
        if (nsMatch) metadata.namespace = nsMatch[1];

        const versionMatch = code.match(/version:\s*["']([^"']+)["']/);
        if (versionMatch) metadata.version = versionMatch[1];

        const descMatch = code.match(/description:\s*["']([^"']+)["']/);
        if (descMatch) metadata.description = descMatch[1];

        const allowedDomainsMatch = code.match(/allowedDomains:\s*(\[[^\]]+\])/);

        if (allowedDomainsMatch) {
            try {
                const arrayStr = allowedDomainsMatch[1].replace(/'/g, '"');
                metadata.allowedDomains = JSON.parse(arrayStr);
            } catch (e) {
                metadata.allowedDomains = [allowedDomainsMatch[1]];
            }
        }

        const schemaMatch = code.match(/inputSchema:\s*({[\s\S]*?})\s*}/);
        if (schemaMatch) {
            metadata.inputSchema = schemaMatch[1];
        }

    } catch (e) {
        console.warn("Failed to extract metadata", e);
    }

    return metadata;
}
