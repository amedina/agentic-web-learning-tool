export const metadata = {
    name: "add-comment",
    namespace: "user_scripts",
    description: "Scrolls down to the comment section and adds the given comment",
    version: "1.0.0",
    match: ["<all_urls>"],
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The comment given by the user"
            }
        }
    };
}

export async function execute(args) {
    console.log("Looks good");
}