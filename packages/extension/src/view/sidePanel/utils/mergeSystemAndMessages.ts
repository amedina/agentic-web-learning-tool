/**
 * Merges a text string (system prompt or tool instructions) into the first 
 * user message in the message history.
 * * If the first user message content is:
 * - An Array: It adds a new text part to the beginning.
 * - A String: It prepends the text with double newlines.
 * - Non-existent: It creates a new user message at the start.
 *
 * @param {Array} messages - The conversation history.
 * @param {string} textToInject - The text to prepend (e.g., system prompt).
 * @returns {Array} The updated message history.
 */
function mergeSystemAndMessages(messages: {
    role: string;
    content: any;
}[], textToInject: string):{
    role: string;
    content: any;
}[] {
    // 1. If the text to inject is empty or just whitespace, do nothing.
    if (!textToInject.trim()) {
        return messages;
    }

    // 2. Create a shallow copy of the messages array to ensure immutability.
    const newMessages = messages.map((msg) => ({
        ...msg
    }));

    // 3. Find the index of the first message with the role "user".
    const userMessageIndex = newMessages.findIndex((msg) => msg.role === "user");

    if (userMessageIndex !== -1) {
        const userMessage = newMessages[userMessageIndex];

        // 4a. If content is an array (e.g., multi-modal with images), add a text block.
        if (Array.isArray(userMessage.content)) {
            const newContent = userMessage.content.slice();

            newContent.unshift({
                type: "text",
                value: `${textToInject}\n\n`
            });

            newMessages[userMessageIndex] = {
                ...userMessage,
                content: newContent
            };
        }
        // 4b. If content is a simple string, prepend the text directly.
        else if (typeof userMessage.content === "string") {
            newMessages[userMessageIndex] = {
                ...userMessage,
                content: `${textToInject}\n\n${userMessage.content}`
            };
        }
    } else {
        // 5. If no user message exists, prepend a new one.
        newMessages.unshift({
            role: "user",
            content: textToInject
        });
    }

    return newMessages;
}

export default mergeSystemAndMessages;
