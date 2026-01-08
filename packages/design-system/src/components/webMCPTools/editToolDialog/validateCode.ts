/**
 * Internal dependencies.
 */
import * as acorn from 'acorn';

/**
 * Validates the code to ensure it has the required metadata and execute function.
 * @param currentCode The code to validate.
 * @returns An object containing a boolean indicating if the code is valid and an optional error message.
 */
export const validateCode = (
	currentCode: string
): { valid: boolean; error?: string } => {
	try {
		// 1. Validate Syntax
		try {
			// We use acorn to parse the code. This avoids using 'new Function' or 'eval'
			// which triggers CSP violations in Chrome Extensions.
			acorn.parse(currentCode, {
				ecmaVersion: 'latest',
				sourceType: 'module',
			});
		} catch (e: any) {
			let errorMsg = `Syntax Error: ${e.message}`;

			// Heuristic for missing comma/semicolon on previous line
			if (e.loc && e.loc.line > 1) {
				const lines = currentCode.split('\n');
				const prevLineIndex = e.loc.line - 2; // 0-indexed, and look at line before error

				// Find the last non-empty line before the error
				let checkIndex = prevLineIndex;
				while (checkIndex >= 0) {
					const line = lines[checkIndex].trim();
					if (line && !line.startsWith('//')) {
						// Check if line ends with a delimiter
						// We exclude }, ], ) because they might need a comma if inside an object/array
						if (!/[;,{]$/.test(line)) {
							errorMsg += `\n(Possible missing comma or semicolon on line ${checkIndex + 1}: "${line}")`;
						}
						break;
					}
					checkIndex--;
				}
			}

			return { valid: false, error: errorMsg };
		}

		// 2. Validate 'metadata' export
		// Checks for: export const metadata = {
		const hasMetadata = /export\s+const\s+metadata\s*=\s*\{/.test(
			currentCode
		);
		if (!hasMetadata) {
			throw new Error(
				'Missing required metadata export. Format: `export const metadata = { ... }`'
			);
		}

		// 3. Validate 'metadata' content keys
		// Required: 'name', 'inputSchema'
		// We use \b to ensure we match whole words (e.g., 'name' vs 'namespace')
		const hasNameKey = /(['"]?)\bname\b\1\s*:/.test(currentCode);
		const hasSchemaKey = /(['"]?)\binputSchema\b\1\s*:/.test(currentCode);

		if (!hasNameKey) {
			throw new Error("Metadata object is missing required key: 'name'.");
		}
		if (!hasSchemaKey) {
			throw new Error(
				"Metadata object is missing required key: 'inputSchema'."
			);
		}

		// 4. Validate 'execute' function export
		// Checks for: export async function execute(
		// We explicitly check for 'async' because MCP tools are asynchronous by default.
		// We use \bexecute\b to ensure we don't match 'executes' or other variations.
		const hasExecute = /export\s+async\s+function\s+\bexecute\b\s*\(/.test(
			currentCode
		);

		if (!hasExecute) {
			throw new Error(
				'Missing required execute function. Format: `export async function execute(args) { ... }`'
			);
		}

		return { valid: true };
	} catch (e: any) {
		return { valid: false, error: e.message };
	}
};
