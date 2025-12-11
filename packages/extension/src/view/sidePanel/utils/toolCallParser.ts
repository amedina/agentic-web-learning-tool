/**
 * A parser for detecting and extracting "fenced" blocks (like ```tool_call)
 * from a streaming text buffer. It manages the buffer, detects partial
 * fence starts/ends, and tracks state (in/out of a fence).
 */
export class ToolCallParser {
    FENCE_STARTS = ["```tool_call"];
    FENCE_END = "```";
    buffer = "";
    inFence = false;
    fenceStartBuffer = "";
    constructor() {}

    /**
     * Adds a new chunk of text to the internal buffer.
     * @param {string} chunk - The text chunk to add.
     */
    addChunk(chunk: string) {
        this.buffer += chunk;
    }

    /**
     * Gets the current content of the buffer.
     * @returns {string} The buffer content.
     */
    getBuffer() {
        return this.buffer;
    }

    /**
     * Clears the internal buffer.
     */
    clearBuffer() {
        this.buffer = "";
    }

    /**
     * (One-shot detection) Detects the first complete fence in the *entire* buffer.
     * This method consumes the buffer up to and including the first fence found
     * and then clears itself.
     * @returns {{fence: string | null, prefixText: string, remainingText: string, overlapLength: number}}
     */
    detectFence() {
        const { index: startIndex, prefix: startPrefix } = this.findFenceStart(this.buffer);

        // --- No Fence Start Found ---
        if (startIndex === -1) {
            // Check for partial fence starts at the end of the buffer
            const overlapLength = this.computeOverlapLength(this.buffer, this.FENCE_STARTS);
            const safeLength = this.buffer.length - overlapLength;
            
            const prefixText = safeLength > 0 ? this.buffer.slice(0, safeLength) : "";
            const overlapText = overlapLength > 0 ? this.buffer.slice(-overlapLength) : "";

            // Keep the partial overlap for the next chunk
            this.buffer = overlapText;
            
            return {
                fence: null,
                prefixText: prefixText,
                remainingText: "",
                overlapLength: overlapLength
            };
        }

        // --- Fence Start Found ---
        // Extract text *before* the fence
        const prefixText = this.buffer.slice(0, startIndex);
        
        // Move buffer to the start of the fence
        this.buffer = this.buffer.slice(startIndex);

        const prefixLength = startPrefix?.length ?? 0;
        
        // Look for the end of the fence
        const endIndex = this.buffer.indexOf(this.FENCE_END, prefixLength);

        // --- Fence End NOT Found (Incomplete Fence) ---
        if (endIndex === -1) {
            // Return the prefix text; the buffer still holds the incomplete fence
            return {
                fence: null,
                prefixText: prefixText,
                remainingText: "",
                overlapLength: 0
            };
        }

        // --- Fence End Found (Complete Fence) ---
        const fenceEndPosition = endIndex + this.FENCE_END.length;
        const fence = this.buffer.slice(0, fenceEndPosition);
        const remainingText = this.buffer.slice(fenceEndPosition);

        // This method is one-shot; it clears the buffer after finding one fence.
        this.buffer = ""; 
        
        return {
            fence: fence,
            prefixText: prefixText,
            remainingText: remainingText,
            overlapLength: 0
        };
    }

    /**
     * Finds the first occurrence of any FENCE_STARTS string in the text.
     * @param {string} text - The text to search.
     * @returns {{index: number, prefix: string | null}} The index of the *earliest* start string.
     */
    findFenceStart(text: string) {
        let minIndex = -1;
        let matchingPrefix = null;

        for (const prefix of this.FENCE_STARTS) {
            const index = text.indexOf(prefix);
            if (index !== -1 && (minIndex === -1 || index < minIndex)) {
                minIndex = index;
                matchingPrefix = prefix;
            }
        }
        return {
            index: minIndex,
            prefix: matchingPrefix
        };
    }

    /**
     * Calculates the length of the longest partial prefix match at the *end* of the text.
     * This is used to avoid outputting a partial fence marker.
     * @param {string} text - The text buffer.
     * @param {string[]} prefixes - The list of prefixes (or suffixes) to check for.
     * @returns {number} The length of the longest partial match.
     */
    computeOverlapLength(text: string, prefixes: string[]) {
        let maxOverlap = 0;
        for (const prefix of prefixes) {
            // We only need to check for overlaps up to prefix.length - 1
            // A full match would have been found by indexOf
            const maxLength = Math.min(text.length, prefix.length - 1);
            for (let length = maxLength; length > 0; length -= 1) {
                if (prefix.startsWith(text.slice(-length))) {
                    maxOverlap = Math.max(maxOverlap, length);
                    break; // Found the longest overlap for *this* prefix
                }
            }
        }
        return maxOverlap;
    }

    /**
     * Checks if the buffer has any content.
     * @returns {boolean}
     */
    hasContent() {
        return this.buffer.length > 0;
    }

    /**
     * Returns the current size of the buffer.
     * @returns {number}
     */
    getBufferSize() {
        return this.buffer.length;
    }

    /**
     * (Streaming detection) Processes the buffer to detect fence transitions.
     * This is the main method for streaming, as it manages state (`this.inFence`)
     * and incomplete chunks.
     * @returns {{inFence: boolean, safeContent: string, completeFence: string | null, textAfterFence: string}}
     */
    detectStreamingFence() {
        // --- STATE: Not in a fence ---
        if (!this.inFence) {
            const { index: startIndex, prefix: startPrefix } = this.findFenceStart(this.buffer);

            // --- No Fence Start Found ---
            if (startIndex === -1) {
                // Check for partial fence starts at the end
                const overlapLength = this.computeOverlapLength(this.buffer, this.FENCE_STARTS);
                const safeLength = this.buffer.length - overlapLength;
                
                const safeContent = safeLength > 0 ? this.buffer.slice(0, safeLength) : "";
                
                // Keep only the overlapping part in the buffer
                this.buffer = this.buffer.slice(safeLength);
                
                return {
                    inFence: false,
                    safeContent: safeContent,
                    completeFence: null,
                    textAfterFence: ""
                };
            }
            
            // --- Fence Start Found ---
            const safeContent = this.buffer.slice(0, startIndex); // Text *before* the fence
            const prefixLength = startPrefix?.length ?? 0;
            
            // Consume the text before the fence and the fence start string
            this.buffer = this.buffer.slice(startIndex + prefixLength);

            // Also strip a single newline immediately after the fence start
            if (this.buffer.startsWith("\n")) {
                this.buffer = this.buffer.slice(1);
            }

            // Update state
            this.inFence = true;
            this.fenceStartBuffer = ""; // Clear internal fence content buffer
            
            return {
                inFence: true,
                safeContent: safeContent,
                completeFence: null,
                textAfterFence: ""
            };
        }
        
        // --- STATE: In a fence ---
        const endIndex = this.buffer.indexOf(this.FENCE_END);

        // --- Fence End NOT Found ---
        if (endIndex === -1) {
            // Check for partial fence *ends*
            const overlapLength = this.computeOverlapLength(this.buffer, [this.FENCE_END]);
            const safeLength = this.buffer.length - overlapLength;

            if (safeLength > 0) {
                const safeContent = this.buffer.slice(0, safeLength);
                this.fenceStartBuffer += safeContent; // Add to internal fence buffer
                this.buffer = this.buffer.slice(safeLength); // Keep overlap
                
                return {
                    inFence: true,
                    safeContent: safeContent, // This is content *inside* the fence
                    completeFence: null,
                    textAfterFence: ""
                };
            }

            // Buffer is empty or only contains overlap
            return {
                inFence: true,
                safeContent: "",
                completeFence: null,
                textAfterFence: ""
            };
        }

        // --- Fence End Found ---
        const fenceContent = this.buffer.slice(0, endIndex); // Text *before* the end fence
        this.fenceStartBuffer += fenceContent; // Add final part to internal buffer

        // Reconstruct the full fence block
        const completeFence = `${this.FENCE_STARTS[0]}\n${this.fenceStartBuffer}\n${this.FENCE_END}`;
        
        const textAfterFence = this.buffer.slice(endIndex + this.FENCE_END.length);

        // Reset state
        this.inFence = false;
        this.fenceStartBuffer = "";
        this.buffer = textAfterFence; // Buffer now only contains text *after* the fence
        
        return {
            inFence: false,
            safeContent: fenceContent, // Final content *inside* the fence
            completeFence: completeFence,
            textAfterFence: textAfterFence
        };
    }

    /**
     * Returns the current fence state.
     * @returns {boolean} True if the parser is inside a fence.
     */
    isInFence() {
        return this.inFence;
    }

    /**
     * Resets the streaming state.
     */
    resetStreamingState() {
        this.inFence = false;
        this.fenceStartBuffer = "";
    }
}
