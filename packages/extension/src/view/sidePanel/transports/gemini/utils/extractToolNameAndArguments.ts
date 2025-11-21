/**
 * Extracts the value associated with the "arguments" key from a raw string.
 * It handles nested objects/arrays and ignores braces inside strings.
 * * @param {string} inputString - The raw string containing JSON data (e.g. from an LLM stream).
 * @returns {string} The extracted JSON string for the arguments.
 */
export function extractArguments(inputString: string): string {
    // 1. Find the position of "arguments": followed by optional whitespace
    const match = inputString.match(/"arguments"\s*:\s*/);
    
    // If "arguments" key is not found, return empty string
    if (!match || match.index === undefined) {
        return "";
    }

    // Calculate where the value actually starts (after the match)
    const valueStartIndex = match.index + match[0].length;
    
    let result = "";
    let nestingDepth = 0;     // Tracks open braces/brackets ({ or [)
    let isInsideString = false; // Tracks if we are currently inside a JSON string value
    let isEscaped = false;    // Tracks if the previous character was a backslash (\)
    let hasStarted = false;   // Tracks if we have found the start of the actual value

    // Iterate through the string character by character
    for (let i = valueStartIndex; i < inputString.length; i++) {
        const char = inputString[i];
        
        // Accumulate every character found
        result += char;

        // --- Phase 1: Seeking the start of the value ---
        if (!hasStarted) {
            // If it's whitespace, keep looping (but we added it to result)
            if (!/\s/.test(char)) {
                hasStarted = true;
                // If the value starts with { or [, initialize nesting
                if (char === "{" || char === "[") {
                    nestingDepth = 1;
                }
            }
            continue;
        }

        // --- Phase 2: processing the value ---

        // If previous char was backslash, this char is escaped.
        // Reset flag and ignore this char for structural checks.
        if (isEscaped) {
            isEscaped = false;
            continue;
        }

        // If this char is a backslash, set escape flag for next iteration
        if (char === "\\") {
            isEscaped = true;
            continue;
        }

        // Handle string quotes (toggle state)
        if (char === '"') {
            isInsideString = !isInsideString;
            continue;
        }

        // If we are NOT inside a string, check for structure (braces/brackets)
        if (!isInsideString) {
            if (char === "{" || char === "[") {
                nestingDepth += 1;
            } 
            else if ((char === "}" || char === "]") && nestingDepth > 0) {
                nestingDepth -= 1;
                
                // If nesting returns to 0, we have found the matching closing brace.
                // Stop extracting.
                if (nestingDepth === 0) {
                    break;
                }
            }
        }
    }

    return result;
}

export function extractToolName(value: string) {
    const result = value.match(/\{\s*"name"\s*:\s*"([^"]+)"/);
    return result ? result[1] : null
}