/**
 * Extracts the user-facing tool name from a fully qualified internal tool identifier.
 *
 * This utility strips specific prefixes (e.g., `website_tool_`, `extension_tool_`) and
 * removes internal routing information such as domain names and tab identifiers
 * (e.g., `_tab123_`) to return a clean, human-readable name for the UI.
 *
 * @param {string} toolName - The full, prefixed tool name (e.g., "website_tool_example.com_tab1_get_weather").
 * @returns {string | undefined} The extracted tool name if the pattern matches (e.g., "get_weather"),
 * the original `toolName` if no known prefix is found, or `undefined` if the specific tab pattern is missing after the prefix.
 *
 * @example
 * // Returns "get_weather"
 * getToolNameWithoutPrefix("website_tool_example.com_tab123_get_weather");
 *
 * @example
 * // Returns "search_files"
 * getToolNameWithoutPrefix("extension_tool_local_tab999_search_files");
 *
 * @example
 * // Returns "unknown_tool" (no prefix match)
 * getToolNameWithoutPrefix("unknown_tool");
 */
function getToolNameWithoutPrefix(toolName: string) {
	const websiteToolNamePrefix = 'website_tool_';
	// Incase we decide to add some tools from extension
	const extensionToolNamePrefix = 'extension_tool_';
	let toolNameWithoutHardCodePrefix = '';

	if (toolName.startsWith(websiteToolNamePrefix)) {
		toolNameWithoutHardCodePrefix = toolName.substring(
			websiteToolNamePrefix.length - 1
		);
		const pieces = toolNameWithoutHardCodePrefix.split('_');
		pieces.shift();
		return pieces.join('_').match(/_tab[^_]+_(.+)$/)?.[1];
	}

	if (toolName.startsWith(extensionToolNamePrefix)) {
		toolNameWithoutHardCodePrefix = toolName.substring(
			extensionToolNamePrefix.length - 1
		);
		const pieces = toolNameWithoutHardCodePrefix.split('_');
		pieces.shift();
		return pieces.join('_');
	}

	return toolName;
}

export default getToolNameWithoutPrefix;
